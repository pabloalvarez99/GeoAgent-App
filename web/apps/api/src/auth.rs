use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};

/// Authenticated user extracted from Firebase ID token in Authorization header.
/// We decode the JWT payload (base64) to get the UID without verifying the signature —
/// Firestore REST API validates the token and enforces security rules automatically.
#[derive(Clone, Debug)]
pub struct AuthUser {
    pub uid: String,
    pub token: String,
}

impl<S: Send + Sync> FromRequestParts<S> for AuthUser {
    type Rejection = (StatusCode, &'static str);

    fn from_request_parts<'life0, 'life1, 'async_trait>(
        parts: &'life0 mut Parts,
        _state: &'life1 S,
    ) -> ::core::pin::Pin<
        Box<dyn ::core::future::Future<Output = Result<Self, Self::Rejection>> + Send + 'async_trait>,
    >
    where
        'life0: 'async_trait,
        'life1: 'async_trait,
        Self: 'async_trait,
    {
        let result = (|| {
            let header = parts
                .headers
                .get("authorization")
                .and_then(|v| v.to_str().ok())
                .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization header"))?;

            let token = header
                .strip_prefix("Bearer ")
                .ok_or((StatusCode::UNAUTHORIZED, "Invalid Authorization format"))?
                .to_string();

            let uid = decode_uid(&token)
                .ok_or((StatusCode::UNAUTHORIZED, "Invalid or malformed token"))?;

            Ok(AuthUser { uid, token })
        })();
        Box::pin(async move { result })
    }
}

/// Base64url-decode the JWT payload segment and extract the `sub` claim (Firebase UID).
fn decode_uid(token: &str) -> Option<String> {
    let payload_b64 = token.splitn(3, '.').nth(1)?;
    let bytes = URL_SAFE_NO_PAD.decode(payload_b64).ok()?;
    let payload: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    payload.get("sub")?.as_str().map(String::from)
}
