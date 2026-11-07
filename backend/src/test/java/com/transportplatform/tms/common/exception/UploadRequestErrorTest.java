package com.transportplatform.tms.common.exception;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.*;
class UploadRequestErrorTest {
    @RestController static class UploadProbe {
        @PostMapping(value="/upload",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
        String upload(@RequestPart("file") MultipartFile file) { return "accepted"; }
        @PostMapping("/oversize") String oversize() { throw new MaxUploadSizeExceededException(10L*1024*1024); }
    }
    final MockMvc mvc=MockMvcBuilders.standaloneSetup(new UploadProbe()).setControllerAdvice(new GlobalExceptionHandler()).build();
    @Test void jsonSentToMultipartEndpointIs415RatherThan500() throws Exception {
        mvc.perform(post("/upload").contentType(MediaType.APPLICATION_JSON).content("{\"file\":{}}"))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }
    @Test void validMultipartIsAccepted() throws Exception {
        mvc.perform(multipart("/upload").file(new MockMultipartFile("file","test.pdf","application/pdf","%PDF-test".getBytes())))
                .andExpect(status().isOk());
    }
    @Test void missingFileIs400RatherThan500() throws Exception {
        mvc.perform(multipart("/upload")).andExpect(status().isBadRequest());
    }
    @Test void exceededMultipartLimitIs413RatherThan500() throws Exception {
        mvc.perform(post("/oversize")).andExpect(status().isPayloadTooLarge());
    }
}
