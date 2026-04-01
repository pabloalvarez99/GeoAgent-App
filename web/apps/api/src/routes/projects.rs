use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde_json::{json, Value};
use uuid::Uuid;
use crate::{auth::AuthUser, error::AppError, firestore::{FirestoreClient, IntoAppErr}};

const COL: &str = "projects";

pub async fn list(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let docs = fs.list(&auth.token, &auth.uid, COL, None).await.map_err(|e| e.into_app_err())?;
    Ok(Json(json!(docs)))
}

pub async fn get_one(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let doc = fs
        .get(&auth.token, &auth.uid, COL, &id)
        .await
        .map_err(|e| e.into_app_err())?
        .ok_or(AppError::NotFound)?;
    Ok(Json(doc))
}

pub async fn create(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
    Json(mut body): Json<Value>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let id = body
        .get("id")
        .and_then(|v| v.as_str())
        .map(String::from)
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    stamp(&mut body);
    let doc = fs.set(&auth.token, &auth.uid, COL, &id, &body).await.map_err(|e| e.into_app_err())?;
    Ok((StatusCode::CREATED, Json(doc)))
}

pub async fn update(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(mut body): Json<Value>,
) -> Result<Json<Value>, AppError> {
    stamp(&mut body);
    let doc = fs.set(&auth.token, &auth.uid, COL, &id, &body).await.map_err(|e| e.into_app_err())?;
    Ok(Json(doc))
}

pub async fn del(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    fs.delete(&auth.token, &auth.uid, COL, &id).await.map_err(|e| e.into_app_err())?;
    Ok(StatusCode::NO_CONTENT)
}

fn stamp(body: &mut Value) {
    if let Some(obj) = body.as_object_mut() {
        obj.insert("updatedAt".into(), json!(chrono::Utc::now().to_rfc3339()));
    }
}
