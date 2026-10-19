package com.rogerjaden.bookmyshow.service.interfaces;

import com.rogerjaden.bookmyshow.dto.request.UpdateEmailPreferenceRequest;
import com.rogerjaden.bookmyshow.dto.response.EmailPreferenceResponse;

public interface EmailPreferenceService {
    EmailPreferenceResponse getMyPreferences();
    EmailPreferenceResponse updateMyPreferences(UpdateEmailPreferenceRequest request);
}
