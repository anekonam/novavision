namespace NovaVision.Identity.DTOs;

public record AuthResponse(
    string AccessToken,
    DateTime ExpiresAt,
    string Role,
    string FirstName,
    string LastName
);

public record MfaChallengeResponse(
    string MfaToken,
    bool MfaRequired
);

public record MfaVerifyRequest(
    string MfaToken,
    string Code
);

public record MfaSetupResponse(
    string SharedKey,
    string AuthenticatorUri,
    string QrCodeBase64
);

public record MfaSetupVerifyRequest(string Code);

public record MfaRecoveryRequest(
    string MfaToken,
    string RecoveryCode
);
