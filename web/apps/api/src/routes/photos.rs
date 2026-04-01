use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;
use crate::{auth::AuthUser, error::AppError, firestore::{FirestoreClient, IntoAppErr}};

const COL: &str = "photos";

/// Photos can be filtered by projectId, stationId, or drillHoleId.
pub async fn list(
    State(fs): State<FirestoreClient>,
    auth: AuthUser,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, AppError> {
    // Pick the first recognised filter param
    let filter = ["projectId", "stationId", "drillHoleId"]
        .iter()
        .find_map(|k| params.get(*k).map(|v| (*k, v.as_str())));
    let docs = fs.list(&auth.token, &auth.uid, COL, filter).await.map_err(|e| e.into_app_err())?;
    Ok(Json(json!(docs)))
}

pub async fn get_one(State(fs): State<FirestoreClient>, auth: AuthUser, Path(id): Path<String>) -> Result<Json<Value>, AppError> {
    let doc = fs.get(&auth.token, &auth.uid, COL, &id).await.map_err(|e| e.into_app_err())?.ok_or(AppError::NotFound)?;
    Ok(Json(doc))
}

pub async fn create(State(fs): State<FirestoreClient>, auth: AuthUser, Json(mut body): Json<Value>) -> Result<(StatusCode, Json<Value>), AppError> {
    let id = body.get("id").and_then(|v| v.as_str()).map(String::from).unwrap_or_else(|| Uuid::new_v4().to_string());
    stamp(&mut body);
    Ok((StatusCode::CREATED, Json(fs.set(&auth.token, &auth.uid, COL, &id, &body).await.map_err(|e| e.into_app_err())?)))
}

pub async fn del(State(fs): State<FirestoreClient>, auth: AuthUser, Path(id): Path<String>) -> Result<StatusCode, AppError> {
    fs.delete(&auth.token, &auth.uid, COL, &id).await.map_err(|e| e.into_app_err())?;
    Ok(StatusCode::NO_CONTENT)
}

fn stamp(body: &mut Value) {
    if let Some(obj) = body.as_object_mut() { obj.insert("updatedAt".into(), json!(chrono::Utc::now().to_rfc3339())); }
}
