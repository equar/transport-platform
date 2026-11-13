package com.transportplatform.tms.common.security;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.servlet.view.xslt.XsltViewResolver;

/** Fail closed if server view rendering/SSE fragments are introduced into this JSON API.
 * Guards the unused Spring 6.2 view features described by CVE-2026-47884 / CVE-2026-47890.
 */
@Component
public class ApiOnlyMvcValidator implements SmartInitializingSingleton {
    private final ApplicationContext context;
    public ApiOnlyMvcValidator(ApplicationContext context) { this.context=context; }
    @Override public void afterSingletonsInstantiated() {
        if (!context.getBeansOfType(XsltViewResolver.class).isEmpty()) {
            throw new IllegalStateException("XSLT view resolution is not supported in this API.");
        }
        for (var mapping : context.getBeansOfType(RequestMappingHandlerMapping.class).values()) {
            for (var method : mapping.getHandlerMethods().values()) {
                if (!method.getBeanType().getPackageName().startsWith("com.transportplatform.")) continue;
                boolean body=AnnotatedElementUtils.hasAnnotation(method.getBeanType(),ResponseBody.class)
                        || AnnotatedElementUtils.hasAnnotation(method.getMethod(),ResponseBody.class);
                String type=method.getMethod().getReturnType().getName();
                if (!body || type.contains("SseEmitter") || type.contains("FragmentsRendering")
                        || type.equals("org.springframework.web.servlet.ModelAndView")
                        || org.springframework.web.servlet.View.class.isAssignableFrom(method.getMethod().getReturnType())) {
                    throw new IllegalStateException("Application controllers must return JSON responses, not views or SSE fragments.");
                }
            }
        }
    }
}
