#!/usr/bin/env python3
"""Generate an explicit, transactional QA dataset; never connects to a database."""
import argparse,csv,datetime as dt,json,re,uuid
from pathlib import Path
MARKER='transport-qa-20261107-v1'
COMPANIES=[('Blue Harbor Mobility','Boston','MA','02110','America/New_York'),('Summit Ridge Transit','Denver','CO','80202','America/Denver'),('Cedar Valley Transport','Austin','TX','78701','America/Chicago'),('Lakeview Care Rides','Chicago','IL','60601','America/Chicago'),('Desert Path Mobility','Phoenix','AZ','85004','America/Phoenix'),('Evergreen Community Transit','Seattle','WA','98101','America/Los_Angeles'),('Peachtree Access Transport','Atlanta','GA','30303','America/New_York'),('Keystone Care Transport','Philadelphia','PA','19103','America/New_York'),('Bay Bridge Shuttle','Oakland','CA','94612','America/Los_Angeles'),('Riverbend Mobility','Portland','OR','97204','America/Los_Angeles')]
FIRST=['Ava','Noah','Mia','Ethan','Olivia','Liam','Sofia','Lucas','Amelia','Mason']
LAST=['Reed','Brooks','Parker','Morgan','Hayes','Bennett','Carter','Ellis','Foster','Sullivan']
ROLES=[('ta','TENANT_ADMIN'),('di','DISPATCHER'),('b','BILLING_ADMIN'),('c','COMPLIANCE_ADMIN'),('r','RIDER'),('g','GUARDIAN'),('o','ORGANIZATION_USER')]
class Raw(str): pass
def q(v):
 if isinstance(v,Raw):return str(v)
 if v is None:return 'NULL'
 if isinstance(v,(int,float)):return str(v)
 return "'"+str(v).replace('\\','\\\\').replace("'","''")+"'"
def generate(schema,email_base,password_hash,today):
 columns={}
 for c in schema:columns.setdefault(c['table'],{})[c['column']]=c
 sql=['SET NAMES utf8mb4;',"SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';",'START TRANSACTION;']
 counts={};accounts=[];tenant_ids=[]
 now=Raw('UTC_TIMESTAMP(6)')
 def insert(table,values,var=None):
  values=dict(values)
  for k,v in {'created_by':MARKER,'updated_by':MARKER,'created_at':now,'updated_at':now}.items():
   if k in columns.get(table,{}):values.setdefault(k,v)
  if table in columns:
   unknown=set(values)-set(columns[table]);assert not unknown,(table,unknown)
   missing=[c['column'] for c in columns[table].values() if c['nullable']=='NO' and c['default'] is None and 'auto_increment' not in c['extra'] and c['column'] not in values]
   assert not missing,(table,missing)
  sql.append('INSERT INTO `'+table+'` ('+','.join('`'+k+'`' for k in values)+') VALUES ('+','.join(q(v) for v in values.values())+');')
  counts[table]=counts.get(table,0)+1
  if var:sql.append('SET '+var+'=LAST_INSERT_ID();')
 def date(days):return (today+dt.timedelta(days=days)).isoformat()
 def account(n,role,tag,first,last,subject=None,subject_type=None,index=None):
  suffix=f'{tag}t{n:02d}'+(f'{index:02d}' if index else '')
  email=email_base.split('@')[0]+'+'+suffix+'@'+email_base.split('@')[1]
  var=f'@t{n}_u_{tag}'+(str(index) if index else '')
  insert('app_users',dict(tenant_id=tenant_ids[-1],email=email,first_name=first,last_name=last,password_hash=password_hash,status='ACTIVE',enabled=1,locked=0,must_change_password=0,security_version=0),var)
  insert('user_roles',dict(user_id=Raw(var),role_name='ROLE_'+role))
  if subject:insert('portal_user_scopes',dict(tenant_id=tenant_ids[-1],app_user_id=Raw(var),portal_subject_type=subject_type,portal_subject_id=Raw(subject)))
  insert('notifications',dict(tenant_id=tenant_ids[-1],notification_code=f'QA{n:02d}-{suffix}',recipient_user_id=Raw(var),title='Welcome to your test workspace',message='Synthetic QA data. Use this account to explore your role; no real passenger or payment information is represented.',notification_type='COMPANY_USER_ACTIVATED',channel='IN_APP',delivery_status='SENT',read_status='UNREAD',status='ACTIVE',sent_at=now))
  accounts.append(dict(tenant=f'QA-T{n:02d}',company=COMPANIES[n-1][0],tenant_id=tenant_ids[-1],role=role,email=email,name=first+' '+last,driver_code=f'QA-D{index:02d}' if index else '',portal='Mobile + web' if role in ['DRIVER','RIDER','GUARDIAN'] else 'Web admin portal'))
 insert('subscription_plans',dict(plan_code='QA-TRANSPORT-TEST',name='Transport QA sandbox',description='Synthetic functional test tenants only',tier='ENTERPRISE',monthly_price=0,annual_price=0,currency='USD',max_users=100,max_drivers=100,max_vehicles=100,max_riders=200,max_organizations=20,notes=MARKER,status='ACTIVE'),'@qa_plan')
 for n,(company,city,state,zip_code,zone) in enumerate(COMPANIES,1):
  tid=str(uuid.uuid5(uuid.NAMESPACE_URL,MARKER+f'/tenant/{n}'));tenant_ids.append(tid)
  addr=f'{100+n} Harbor View Lane'; phone=f'+120255501{n:02d}'
  insert('tenants',dict(id=tid,tenant_code=f'QA-T{n:02d}',company_name='[TEST] '+company,legal_name=company+' QA Sandbox LLC',email=f'qa-t{n:02d}@bakaroo.com',phone=phone,address_line1=addr,city=city,state=state,zip_code=zip_code,country='US',business_type='Transportation',subscription_plan='ENTERPRISE',status='ACTIVE',notes='Synthetic test provider — '+MARKER))
  for service in ['GENERAL_TRANSPORT','NEMT','SCHOOL_TRANSPORT','SHUTTLE']:insert('tenant_service_types',dict(tenant_id=tid,service_type=service))
  settings=dict(tenant_id=tid,display_name='[TEST] '+company,timezone=zone,currency='USD',date_format='MM/dd/yyyy',default_ride_lead_time_minutes=30,allow_manual_ride_creation=1,allow_round_trip_rides=1,dispatch_strict_compliance_mode=0,default_invoice_due_days=14,require_driver_license=0,require_background_check=0,require_drug_test=0,require_vehicle_registration=0,require_vehicle_insurance=0,require_vehicle_inspection=0,expiring_soon_threshold_days=30,invoice_prefix=f'QT{n:02d}-INV',payment_prefix=f'QT{n:02d}-PAY',pricing_rule_prefix=f'QT{n:02d}-PR',tax_enabled=0,default_tax_rate=0,allow_manual_invoice_overrides=1,primary_color='#214e82',secondary_color='#12263e',accent_color='#d8662a',custom_login_welcome_text='Test workspace for '+company,custom_footer_text='Synthetic QA workspace')
  insert('tenant_settings',settings)
  insert('tenant_subscriptions',dict(tenant_id=tid,subscription_plan_id=Raw('@qa_plan'),effective_start_date=date(-30),effective_end_date=date(365),renewal_date=date(365),is_trial=0,status='ACTIVE',notes=MARKER))
  org=f'@t{n}_org';contact=f'@t{n}_contact';guardian=f'@t{n}_guardian';contract=f'@t{n}_contract'
  insert('organizations',dict(tenant_id=tid,organization_code='QA-ORG01',organization_type='COMMUNITY_ORGANIZATION',name='[TEST] '+city+' Community Access',legal_name=city+' Community Access QA',address_line1=f'{200+n} Community Circle',city=city,state=state,zip_code=zip_code,country='US',primary_phone=phone,primary_email=f'qa-org{n:02d}@bakaroo.com',status='ACTIVE',notes=MARKER),org)
  insert('organization_contacts',dict(tenant_id=tid,organization_id=Raw(org),first_name='Jordan',last_name=LAST[n-1],email=email_base.split('@')[0]+f'+ot{n:02d}@gmail.com',phone=phone,is_primary=1,status='ACTIVE'),contact)
  insert('contracts',dict(tenant_id=tid,contract_code='QA-CON01',organization_id=Raw(org),contract_type='PRIVATE_ORGANIZATION',contract_name=city+' Community Access Service',description='Synthetic scheduled transport agreement',start_date=date(-30),end_date=date(365),status='ACTIVE',notes=MARKER),contract)
  insert('guardians',dict(tenant_id=tid,first_name='Taylor',last_name=LAST[n-1],email=email_base.split('@')[0]+f'+gt{n:02d}@gmail.com',phone=phone,billing_contact=1,authorized_for_pickup=1,status='ACTIVE',notes=MARKER),guardian)
  for i in range(1,11):
   driver=f'@t{n}_d{i}';vehicle=f'@t{n}_v{i}';rider=f'@t{n}_r{i}'
   first=FIRST[(i+n-2)%10];last=LAST[i-1]
   insert('drivers',dict(tenant_id=tid,driver_code=f'QA-D{i:02d}',first_name=first,last_name=last,email=email_base.split('@')[0]+f'+dt{n:02d}{i:02d}@gmail.com',phone=f'+120255501{i:02d}',driver_type='CONTRACTOR' if i%3==0 else 'EMPLOYEE',status='ACTIVE',hire_date=date(-365-i*20),availability_summary='Monday–Friday, 07:00–18:00',license_number=f'TEST-{n:02d}-{i:02d}',license_state=state,license_expiry_date=date(365),background_check_status='CLEAR',background_check_expiry_date=date(300),drug_test_status='CLEAR',drug_test_expiry_date=date(250),training_status='COMPLETED',training_completion_date=date(-60),emergency_contact_name='Alex '+last,emergency_contact_phone=phone,notes=MARKER),driver)
   insert('vehicles',dict(tenant_id=tid,vehicle_code=f'QA-V{i:02d}',ownership_type='COMPANY_OWNED',make='Ford' if i%2 else 'Toyota',model='Transit' if i%2 else 'Sienna',vehicle_year=2022+i%4,plate_number=f'TEST{n:02d}{i:02d}',plate_state=state,capacity=12 if i%2 else 6,wheelchair_capacity=2 if i%3==0 else 0,fuel_type='GASOLINE',insurance_expiry_date=date(300),registration_expiry_date=date(250),inspection_expiry_date=date(180),mileage=12000+i*4400,assigned_driver_id=Raw(driver),status='ACTIVE',notes=MARKER),vehicle)
   insert('riders',dict(tenant_id=tid,rider_code=f'QA-R{i:02d}',rider_type='PRIVATE_PAY' if i%2 else 'NEMT',first_name=FIRST[(i+3)%10],last_name=LAST[(i+n)%10],primary_phone=f'+120255501{i:02d}',home_address_line1=f'{300+i} Willow Court',city=city,state=state,zip_code=zip_code,country='US',default_pickup_address=f'{300+i} Willow Court, {city}, {state} {zip_code}',default_dropoff_address=f'{200+n} Community Circle, {city}, {state} {zip_code}',wheelchair_required=int(i%3==0),escort_required=int(i%4==0),organization_id=Raw(org),status='ACTIVE',notes=MARKER),rider)
   if i<=3:insert('rider_guardians',dict(tenant_id=tid,rider_id=Raw(rider),guardian_id=Raw(guardian),relationship_type='CAREGIVER',primary_guardian=1,authorized_for_pickup=1,billing_contact=1,status='ACTIVE'))
   route=f'@t{n}_route{i}'
   insert('routes',dict(tenant_id=tid,route_code=f'QA-RT{i:02d}',route_name=f'{city} access route {i}',route_date=date(0),service_type='GENERAL_TRANSPORT',assigned_driver_id=Raw(driver),assigned_vehicle_id=Raw(vehicle),manifest_notes='Synthetic QA route; confirm each pickup in the app.',status='READY'),route)
   for j,(day,status) in enumerate([(0,'ASSIGNED'),(1,'SCHEDULED'),(-1,'COMPLETED')],1):
    ride=f'@t{n}_ride{i}_{j}'
    insert('rides',dict(tenant_id=tid,ride_number=f'QA-T{n:02d}-R{i:02d}-{j}',rider_id=Raw(rider),guardian_id=Raw(guardian) if i<=3 else None,organization_id=Raw(org),contract_id=Raw(contract),service_type='GENERAL_TRANSPORT',trip_type='ONE_WAY',pickup_address_line1=f'{300+i} Willow Court',pickup_city=city,pickup_state=state,pickup_zip_code=zip_code,pickup_country='US',dropoff_address_line1=f'{200+n} Community Circle',dropoff_city=city,dropoff_state=state,dropoff_zip_code=zip_code,dropoff_country='US',scheduled_pickup_at=date(day)+f' {8+i%8:02d}:00:00',scheduled_dropoff_at=date(day)+f' {8+i%8:02d}:45:00',wheelchair_required=int(i%3==0),escort_required=int(i%4==0),companion_count=int(i%5==0),billing_type='CONTRACT',driver_id=Raw(driver) if status!='SCHEDULED' else None,vehicle_id=Raw(vehicle) if status!='SCHEDULED' else None,route_id=Raw(route) if j==1 else None,status=status,internal_notes=MARKER),ride)
    if j==1:insert('route_stops',dict(tenant_id=tid,route_id=Raw(route),ride_id=Raw(ride),stop_sequence=1,status='PLANNED'))
   account(n,'DRIVER','d',first,last,driver,'DRIVER',i)
  for tag,role in ROLES:
   subject,kind={'r':(f'@t{n}_r1','RIDER'),'g':(guardian,'GUARDIAN'),'o':(contact,'ORGANIZATION_CONTACT')}.get(tag,(None,None))
   account(n,role,tag,FIRST[4] if tag=='r' else 'Taylor' if tag=='g' else {'ta':'Alex','di':'Jamie','b':'Robin','c':'Casey'}.get(tag,'Jordan'),LAST[(1+n)%10] if tag=='r' else LAST[n-1],subject,kind)
  for k,(bill_type,target,total,paid) in enumerate([('ORGANIZATION',org,375,0),('RIDER',f'@t{n}_r1',50,50),('GUARDIAN',guardian,100,40)],1):
   inv=f'@t{n}_inv{k}';status='PAID' if paid==total else 'PARTIALLY_PAID' if paid else 'ISSUED'
   refs={'organization_id':Raw(org)} if bill_type=='ORGANIZATION' else {'rider_id':Raw(target)} if bill_type=='RIDER' else {'guardian_id':Raw(target)}
   insert('invoices',dict(tenant_id=tid,invoice_number=f'QA-T{n:02d}-INV{k:02d}',bill_to_type=bill_type,bill_to_id=Raw(target),bill_to_name_snapshot=f'[TEST] {bill_type.title()} transport account',invoice_date=date(-2),due_date=date(14),subtotal=total,tax_amount=0,discount_amount=0,total_amount=total,amount_paid=paid,balance_due=total-paid,currency='USD',status=status,notes=MARKER,**refs),inv)
   insert('invoice_line_items',dict(tenant_id=tid,invoice_id=Raw(inv),line_number=1,description='Synthetic community transport service',charge_source_type='MANUAL',quantity=1,unit_price=total,line_amount=total,service_date=date(-2)))
   if paid:insert('payments',dict(tenant_id=tid,invoice_id=Raw(inv),payment_number=f'QA-T{n:02d}-PAY{k:02d}',payment_date=date(-1),amount=paid,payment_method='CASH',reference_number='TEST-NO-REAL-FUNDS',status='APPLIED',notes=MARKER))
 sql.append('COMMIT;')
 return '\n'.join(sql)+'\n',accounts,counts,tenant_ids
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--schema-json',type=Path,required=True);p.add_argument('--hash-file',type=Path,required=True);p.add_argument('--email-base',required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--date',default=dt.date.today().isoformat());a=p.parse_args()
 if not re.fullmatch(r'[^+\s@]+@gmail\.com',a.email_base):p.error('Use a Gmail base address without a plus tag.')
 password_hash=a.hash_file.read_text().strip()
 if not re.fullmatch(r'\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}',password_hash):p.error('A BCrypt hash is required; do not pass a plaintext password.')
 sql,accounts,counts,tids=generate(json.loads(a.schema_json.read_text()),a.email_base,password_hash,dt.date.fromisoformat(a.date))
 a.output_dir.mkdir(parents=True,exist_ok=True);(a.output_dir/'seed.sql').write_text(sql);(a.output_dir/'seed.sql').chmod(0o600)
 with (a.output_dir/'accounts.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(accounts[0]));w.writeheader();w.writerows(accounts)
 (a.output_dir/'manifest.json').write_text(json.dumps(dict(marker=MARKER,counts=counts,tenant_ids=tids,emails=[a['email'] for a in accounts]),indent=2)+'\n')
 print(json.dumps(counts,sort_keys=True))
