package com.transportplatform.tms.common.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.web.servlet.view.xslt.XsltViewResolver;

class ApiOnlyMvcValidatorTest {
    @Test void rejectsXsltViewResolutionBeforeServingRequests() {
        ApplicationContext context = mock(ApplicationContext.class);
        when(context.getBeansOfType(XsltViewResolver.class))
                .thenReturn(Map.of("unsafeViewResolver", new XsltViewResolver()));
        assertThrows(IllegalStateException.class,
                () -> new ApiOnlyMvcValidator(context).afterSingletonsInstantiated());
    }
}
