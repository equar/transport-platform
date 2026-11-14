package com.transportplatform.tms.features.riderguardianportal.api;

import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalAccessService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class PortalBillingPrivacyTest {

    @Test void anotherRidersInvoiceIsHiddenEvenInsideTheSameTenant() {
        var access=mock(RiderGuardianPortalAccessService.class);var invoices=mock(InvoiceRepository.class);var lines=mock(InvoiceLineItemRepository.class);
        var rider=mock(Rider.class);when(rider.getId()).thenReturn(1L);
        var user=new AuthenticatedUser(7L,"tenant-a","a@example.com","A","Rider","",true,true,false,List.of());
        when(access.resolveCurrentScope()).thenReturn(new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(user,PortalSubjectType.RIDER,rider,null,List.of(),List.of()));
        var invoice=new Invoice();invoice.setTenantId("tenant-a");invoice.setRiderId(2L);
        when(invoices.findByIdAndTenantId(10L,"tenant-a")).thenReturn(Optional.of(invoice));
        var controller=new PortalBillingDetailsController(access,invoices,lines,mock(PaymentRepository.class));
        assertEquals("RESOURCE_NOT_FOUND",assertThrows(ApiException.class,()->controller.invoice(10L)).getErrorCode().name());
        verifyNoInteractions(lines);
    }
    @Test void portalInvoiceSchemaNeverExposesStaffNotesOrCollectionNotes() {
        var fields=Arrays.stream(PortalBillingDetailsController.InvoiceDetail.class.getRecordComponents()).map(java.lang.reflect.RecordComponent::getName).toList();
        assertFalse(fields.contains("notes"));assertFalse(fields.contains("collectionNotes"));assertFalse(fields.contains("createdBy"));
    }

    @Test
    void guardianCannotViewLinkedRiderInvoiceWhenNotBillingContact() {
        var access = mock(RiderGuardianPortalAccessService.class);
        var invoices = mock(InvoiceRepository.class);
        var scope = guardianScope(false);
        when(access.resolveCurrentScope()).thenReturn(scope);
        Invoice invoice = invoiceForRider(2L);
        when(invoices.findByIdAndTenantId(10L, "tenant-a")).thenReturn(Optional.of(invoice));

        var controller = new PortalBillingDetailsController(access, invoices,
                mock(InvoiceLineItemRepository.class), mock(PaymentRepository.class));

        assertEquals("RESOURCE_NOT_FOUND",
                assertThrows(ApiException.class, () -> controller.invoice(10L)).getErrorCode().name());
        assertEquals(List.of(), scope.billingRiderIds());
    }

    @Test
    void guardianBillingContactCanViewLinkedRiderInvoice() {
        var access = mock(RiderGuardianPortalAccessService.class);
        var invoices = mock(InvoiceRepository.class);
        var scope = guardianScope(true);
        when(access.resolveCurrentScope()).thenReturn(scope);
        when(invoices.findByIdAndTenantId(10L, "tenant-a")).thenReturn(Optional.of(invoiceForRider(2L)));
        var controller = new PortalBillingDetailsController(access, invoices,
                mock(InvoiceLineItemRepository.class), mock(PaymentRepository.class));
        setTenantTime(controller);

        assertTrue(controller.invoice(10L).success());
        assertEquals(List.of(2L), scope.billingRiderIds());
    }

    @Test
    void guardianCanViewInvoiceAddressedDirectlyToThemWithoutBillingContactLink() {
        var access = mock(RiderGuardianPortalAccessService.class);
        var invoices = mock(InvoiceRepository.class);
        var scope = guardianScope(false);
        when(access.resolveCurrentScope()).thenReturn(scope);
        Invoice invoice = invoiceForRider(2L);
        invoice.setGuardianId(7L);
        when(invoices.findByIdAndTenantId(10L, "tenant-a")).thenReturn(Optional.of(invoice));
        var controller = new PortalBillingDetailsController(access, invoices,
                mock(InvoiceLineItemRepository.class), mock(PaymentRepository.class));
        setTenantTime(controller);

        assertTrue(controller.invoice(10L).success());
    }

    private RiderGuardianPortalAccessService.ResolvedRiderGuardianScope guardianScope(boolean billingContact) {
        var user = new AuthenticatedUser(7L, "tenant-a", "guardian@example.com", "A", "Guardian", "",
                true, true, false, List.of());
        var guardian = mock(Guardian.class);
        when(guardian.getId()).thenReturn(7L);
        var rider = mock(Rider.class);
        when(rider.getId()).thenReturn(2L);
        var link = new RiderGuardian();
        link.setRider(rider);
        link.setBillingContact(billingContact);
        return new RiderGuardianPortalAccessService.ResolvedRiderGuardianScope(
                user, PortalSubjectType.GUARDIAN, null, guardian, List.of(link), List.of(rider));
    }

    private Invoice invoiceForRider(Long riderId) {
        var invoice = new Invoice();
        invoice.setTenantId("tenant-a");
        invoice.setRiderId(riderId);
        invoice.setInvoiceNumber("INV-1");
        invoice.setStatus(InvoiceStatus.ISSUED);
        invoice.setDueDate(LocalDate.now().plusDays(1));
        return invoice;
    }

    private void setTenantTime(PortalBillingDetailsController controller) {
        var tenantTime = mock(com.transportplatform.tms.features.settings.application.TenantTimeService.class);
        when(tenantTime.today("tenant-a")).thenReturn(LocalDate.now());
        ReflectionTestUtils.setField(controller, "tenantTime", tenantTime);
    }
}
