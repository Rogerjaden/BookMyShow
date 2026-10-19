
package com.rogerjaden.bookmyshow.service.interfaces;

public interface EmailVerificationService {

    void createAndSendVerification(Long userId);

    void verifyEmail(String token);

    void resendVerification(String email);
}
