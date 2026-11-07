package com.transportplatform.tms.features.riderguardianportal.api;
import com.transportplatform.tms.common.exception.ApiException;
import com.transportplatform.tms.common.security.AuthenticatedUser;
import com.transportplatform.tms.features.billing.domain.*;
import com.transportplatform.tms.features.rider.domain.*;
import com.transportplatform.tms.features.portalaccess.domain.PortalSubjectType;
import com.transportplatform.tms.features.riderguardianportal.application.RiderGuardianPortalAccessService;
import org.junit.jupiter.api.Test;
import java.util.*;
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
}
