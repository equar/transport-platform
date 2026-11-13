"""Review probes. Mutates ONLY an explicitly acknowledged disposable local demo.
Run against the isolated demo described in ../production-review-2026-11-13.md.
Never run against a database containing real operations or customer records.
"""
import concurrent.futures
import http.cookiejar
import json
import os
import threading
import urllib.error
import urllib.request
import uuid
from datetime import date, timedelta

BASE = 'http://127.0.0.1:8082/api'
if os.environ.get('TRANSPORT_REVIEW_DISPOSABLE') != 'YES':
    raise SystemExit('Set TRANSPORT_REVIEW_DISPOSABLE=YES only for the disposable review database.')


def request(path, body=None, headers=None, method=None, opener=None):
    req = urllib.request.Request(BASE + path,
        None if body is None else json.dumps(body).encode(),
        {'Content-Type': 'application/json', **(headers or {})}, method=method)
    try:
        response = opener.open(req) if opener else urllib.request.urlopen(req)
        return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        try:
            payload = json.load(error)
        except ValueError:
            payload = {}
        return error.code, payload


def login(role, opener=None):
    mobile = role in ('driver', 'rider', 'guardian')
    headers = {'X-Client-Platform': 'mobile' if mobile else 'web'}
    status, result = request('/v1/auth/login',
        {'email': role + '@demo.test', 'password': 'Password123'}, headers, opener=opener)
    assert status == 200, ('login', role, status)
    identity = result['data']['user']
    assert identity['email'] == role + '@demo.test'
    assert identity['tenantId'] == 'demo-metro-mobility-000000000001'
    return {**headers, 'Authorization': 'Bearer ' + result['data']['accessToken']}


def emit(name, result):
    print(json.dumps({'probe': name, **result}, sort_keys=True))


# A browser shares one refresh cookie between independent tabs.
cookies = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
admin = login('tenant.admin', opener)
cookie_header = '; '.join(c.name + '=' + c.value for c in cookies)
barrier = threading.Barrier(2)

def refresh(_):
    barrier.wait()
    return request('/v1/auth/refresh', {}, {'Cookie': cookie_header})

with concurrent.futures.ThreadPoolExecutor(2) as executor:
    results = list(executor.map(refresh, range(2)))
emit('parallel_refresh', {
    'statuses': [s for s, _ in results],
    'old_access_after': request('/runtime/tenant-capabilities', headers=admin)[0],
    'new_access_after': [request('/runtime/tenant-capabilities', headers={
        'Authorization': 'Bearer ' + r['data']['accessToken']})[0]
        for s, r in results if s == 200],
})

# Distinct recorded payments must all affect their invoice when applied.
billing = login('billing')
invoice_status, invoice = request('/company/invoices/1', headers=billing)
assert invoice_status == 200 and invoice['data']['invoiceNumber'] == 'INV-DEMO-1001'
payment_ids = []
for _ in range(4):
    status, result = request('/company/payments', {
        'invoiceId': 1, 'paymentDate': date.today().isoformat(), 'amount': 1,
        'paymentMethod': 'CASH', 'applyImmediately': False,
        'referenceNumber': 'isolated-review-concurrency',
    }, {**billing, 'Idempotency-Key': str(uuid.uuid4())})
    assert status == 201, ('record payment', status)
    payment_ids.append(result['data']['id'])
before = request('/company/invoices/1', headers=billing)[1]['data']['amountPaid']
barrier = threading.Barrier(4)

def apply(payment_id):
    barrier.wait()
    return request(f'/company/payments/{payment_id}/apply', {}, billing)

with concurrent.futures.ThreadPoolExecutor(4) as executor:
    results = list(executor.map(apply, payment_ids))
after = request('/company/invoices/1', headers=billing)[1]['data']['amountPaid']
emit('concurrent_payment_application', {
    'statuses': [s for s, _ in results], 'amount_paid_before': before,
    'amount_paid_after': after, 'expected_amount_paid': before + sum(s == 200 for s, _ in results),
    'saved_payment_statuses': [request(f'/company/payments/{i}', headers=billing)[1]['data']['status']
                               for i in payment_ids],
})

organization = login('organization')
for path in ('/portal/organization/profile', '/portal/organization/rides'):
    emit('organization_optional_address', {'path': path, 'status': request(path, headers=organization)[0]})

driver = login('driver')
for heading in (-1, None):
    status, result = request('/portal/driver/rides/1/location-snapshots', {
        'latitude': 33.75, 'longitude': -84.39, 'accuracyMeters': 10, 'headingDegrees': heading,
    }, driver)
    emit('location_unknown_course', {'heading': heading, 'status': status, 'error': result.get('error')})
for path in ('/company/riders', '/portal/driver/rides/2', '/portal/driver/rides/999999', '/portal/rider/rides'):
    emit('driver_scope_boundary', {'path': path, 'status': request(path, headers=driver)[0]})

# One complete, synthetic, future one-way trip.
admin = login('tenant.admin')
status, source = request('/company/rides/2', headers=admin)
assert status == 200
ride = source['data']
fields = '''riderId guardianId organizationId contractId serviceAreaId serviceType tripType
pickupAddressLine1 pickupAddressLine2 pickupCity pickupState pickupZipCode pickupCountry
dropoffAddressLine1 dropoffAddressLine2 dropoffCity dropoffState dropoffZipCode dropoffCountry
scheduledPickupAt scheduledDropoffAt returnPickupAt returnDropoffAt wheelchairRequired
escortRequired companionCount specialInstructions internalNotes operationalNotes priorityLevel billingType'''.split()
payload = {k: ride.get(k) for k in fields}
tomorrow = (date.today() + timedelta(days=1)).isoformat()
payload.update(tripType='ONE_WAY', scheduledPickupAt=tomorrow + 'T12:00:00',
               scheduledDropoffAt=tomorrow + 'T13:00:00', returnPickupAt=None, returnDropoffAt=None,
               status='SCHEDULED')
status, created = request('/company/rides', payload, admin)
emit('create_synthetic_ride', {'status': status})
if status == 201:
    ride_id = created['data']['id']
    status, assigned = request(f'/company/rides/{ride_id}/assign-resources', {'driverId': 1, 'vehicleId': 1}, admin)
    emit('assign_synthetic_ride', {'status': status, 'error': assigned.get('error')})
    if status == 200:
        expected = 'ASSIGNED'
        for action, next_status in [('driver-en-route', 'DRIVER_EN_ROUTE'), ('arrived', 'ARRIVED'),
                                    ('picked-up', 'PICKED_UP'), ('dropped-off', 'DROPPED_OFF'), ('complete', 'COMPLETED')]:
            key = str(uuid.uuid4())
            status, result = request(f'/portal/driver/rides/{ride_id}/actions/{action}', {},
                {**driver, 'Idempotency-Key': key, 'X-Expected-Ride-Status': expected})
            emit('trip_transition', {'action': action, 'status': status,
                 'ride_status': (result.get('data') or {}).get('status'), 'error': result.get('error')})
            if status != 200:
                break
            expected = next_status
    status, notifications = request('/notifications?size=5', headers=driver)
    items = (notifications.get('data') or {}).get('items', [])
    emit('notification_wire_contract', {'status': status,
         'keys': sorted(items[0]) if items else [],
         'mobile_expected_keys_present': bool(items and 'subject' in items[0] and 'summary' in items[0])})

# Settings advertised as operational restrictions must affect the write path.
status, settings_response = request('/company/settings', headers=admin)
settings = settings_response['data']
restricted = {**settings, 'allowManualRideCreation': False, 'allowRoundTripRides': False}
status, result = request('/company/settings', restricted, admin, method='PUT')
emit('disable_creation_settings', {'status': status})
if status == 200:
    round_trip = {**payload, 'tripType': 'ROUND_TRIP', 'returnPickupAt': tomorrow + 'T15:00:00',
                  'returnDropoffAt': tomorrow + 'T16:00:00'}
    status, created = request('/company/rides', round_trip, admin)
    emit('create_despite_disabled_settings', {'status': status,
         'trip_type': (created.get('data') or {}).get('tripType')})
    request('/company/settings', settings, admin, method='PUT')

# Sequential stale edits are not covered by a JPA version loaded anew on each request.
status, created = request('/company/rides', {**payload, 'internalNotes': 'original'}, admin)
if status == 201:
    stale_id = created['data']['id']
    first_status, _ = request(f'/company/rides/{stale_id}', {**payload, 'internalNotes': 'operator A'}, admin, method='PUT')
    stale_status, _ = request(f'/company/rides/{stale_id}', {**payload, 'internalNotes': 'original',
                                                        'specialInstructions': 'operator B'}, admin, method='PUT')
    final = request(f'/company/rides/{stale_id}', headers=admin)[1]['data']
    emit('stale_ride_edit', {'first_status': first_status, 'stale_status': stale_status,
                           'final_internal_notes': final['internalNotes']})

# The web payment client currently sends no idempotency key on retry.
duplicate_ids = []
for _ in range(2):
    status, result = request('/company/payments', {
        'invoiceId': 1, 'paymentDate': date.today().isoformat(), 'amount': 1,
        'paymentMethod': 'CASH', 'applyImmediately': False,
        'referenceNumber': 'isolated-review-identical-retry',
    }, billing)
    if status == 201:
        duplicate_ids.append(result['data']['id'])
emit('identical_payment_without_key', {'created_count': len(duplicate_ids),
     'distinct_records': len(set(duplicate_ids))})
