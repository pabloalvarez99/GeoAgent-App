use anyhow::Result;
use serde_json::{json, Value};

const FS_BASE: &str = "https://firestore.googleapis.com/v1";

#[derive(Clone)]
pub struct FirestoreClient {
    http: reqwest::Client,
    pub project_id: String,
}

impl FirestoreClient {
    pub fn new(project_id: String) -> Self {
        Self {
            http: reqwest::Client::new(),
            project_id,
        }
    }

    /// Path to user's document root: `.../documents/users/{uid}`
    fn user_root(&self, uid: &str) -> String {
        format!(
            "{FS_BASE}/projects/{}/databases/(default)/documents/users/{uid}",
            self.project_id
        )
    }

    /// Path to a collection: `.../documents/users/{uid}/{col}`
    fn col_path(&self, uid: &str, col: &str) -> String {
        format!("{}/{col}", self.user_root(uid))
    }

    /// Path to a document: `.../documents/users/{uid}/{col}/{id}`
    fn doc_path(&self, uid: &str, col: &str, id: &str) -> String {
        format!("{}/{col}/{id}", self.user_root(uid))
    }

    // ── List ────────────────────────────────────────────────────────────────

    /// List documents in a collection, optionally filtering by one field == value.
    pub async fn list(
        &self,
        token: &str,
        uid: &str,
        col: &str,
        filter: Option<(&str, &str)>,
    ) -> Result<Vec<Value>> {
        let parent = self.user_root(uid);
        let query = build_query(col, filter);

        let resp = self
            .http
            .post(format!("{parent}:runQuery"))
            .bearer_auth(token)
            .json(&query)
            .send()
            .await?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(firebase_err(status.as_u16(), body));
        }

        let results: Vec<Value> = resp.json().await?;
        let docs = results
            .into_iter()
            .filter_map(|r| r.get("document").cloned().map(|d| doc_to_json(&d)))
            .collect();

        Ok(docs)
    }

    // ── Get ─────────────────────────────────────────────────────────────────

    pub async fn get(&self, token: &str, uid: &str, col: &str, id: &str) -> Result<Option<Value>> {
        let url = self.doc_path(uid, col, id);
        let resp = self.http.get(&url).bearer_auth(token).send().await?;

        if resp.status().as_u16() == 404 {
            return Ok(None);
        }
        if !resp.status().is_success() {
            let st = resp.status().as_u16();
            let body = resp.text().await.unwrap_or_default();
            return Err(firebase_err(st, body));
        }

        let doc: Value = resp.json().await?;
        Ok(Some(doc_to_json(&doc)))
    }

    // ── Set (create / update) ───────────────────────────────────────────────

    /// PATCH — creates or fully replaces a document.
    pub async fn set(
        &self,
        token: &str,
        uid: &str,
        col: &str,
        id: &str,
        data: &Value,
    ) -> Result<Value> {
        let url = self.doc_path(uid, col, id);
        let body = json!({ "fields": json_to_fields(data) });

        let resp = self
            .http
            .patch(&url)
            .bearer_auth(token)
            .json(&body)
            .send()
            .await?;

        if !resp.status().is_success() {
            let st = resp.status().as_u16();
            let b = resp.text().await.unwrap_or_default();
            return Err(firebase_err(st, b));
        }

        let doc: Value = resp.json().await?;
        Ok(doc_to_json(&doc))
    }

    // ── Delete ──────────────────────────────────────────────────────────────

    pub async fn delete(&self, token: &str, uid: &str, col: &str, id: &str) -> Result<()> {
        let url = self.doc_path(uid, col, id);
        let resp = self.http.delete(&url).bearer_auth(token).send().await?;

        let st = resp.status().as_u16();
        if !resp.status().is_success() && st != 404 {
            let b = resp.text().await.unwrap_or_default();
            return Err(firebase_err(st, b));
        }
        Ok(())
    }
}

// ── Firestore structured query ───────────────────────────────────────────────

fn build_query(col: &str, filter: Option<(&str, &str)>) -> Value {
    match filter {
        None => json!({
            "structuredQuery": {
                "from": [{ "collectionId": col }]
            }
        }),
        Some((field, value)) => json!({
            "structuredQuery": {
                "from": [{ "collectionId": col }],
                "where": {
                    "fieldFilter": {
                        "field": { "fieldPath": field },
                        "op": "EQUAL",
                        "value": { "stringValue": value }
                    }
                }
            }
        }),
    }
}

// ── Firestore ↔ JSON conversion ──────────────────────────────────────────────

/// Convert a full Firestore document into clean JSON `{ "id": "...", ...fields }`.
pub fn doc_to_json(doc: &Value) -> Value {
    let id = doc
        .get("name")
        .and_then(|n| n.as_str())
        .and_then(|n| n.rsplit('/').next())
        .unwrap_or("")
        .to_string();

    let mut map = serde_json::Map::new();
    map.insert("id".into(), json!(id));

    if let Some(fields) = doc.get("fields").and_then(|f| f.as_object()) {
        for (k, v) in fields {
            map.insert(k.clone(), fs_val_to_json(v));
        }
    }

    Value::Object(map)
}

/// Firestore field value → plain JSON value.
fn fs_val_to_json(v: &Value) -> Value {
    if let Some(s) = v.get("stringValue")   { return s.clone(); }
    if let Some(d) = v.get("doubleValue")   { return d.clone(); }
    if let Some(b) = v.get("booleanValue")  { return b.clone(); }
    if v.get("nullValue").is_some()         { return Value::Null; }
    if let Some(t) = v.get("timestampValue") { return t.clone(); }

    if let Some(i) = v.get("integerValue") {
        if let Some(s) = i.as_str() {
            if let Ok(n) = s.parse::<i64>() { return json!(n); }
        }
        return i.clone();
    }

    if let Some(map) = v.get("mapValue").and_then(|m| m.get("fields")).and_then(|f| f.as_object()) {
        let obj: serde_json::Map<_, _> = map.iter().map(|(k, v)| (k.clone(), fs_val_to_json(v))).collect();
        return Value::Object(obj);
    }

    if let Some(arr) = v.get("arrayValue") {
        let values = arr.get("values").and_then(|v| v.as_array()).map(|a| {
            a.iter().map(fs_val_to_json).collect::<Vec<_>>()
        }).unwrap_or_default();
        return json!(values);
    }

    Value::Null
}

/// Plain JSON object → Firestore `fields` map.
pub fn json_to_fields(data: &Value) -> Value {
    if let Some(obj) = data.as_object() {
        let fields: serde_json::Map<_, _> = obj
            .iter()
            .filter(|(k, _)| k.as_str() != "id") // id is in the doc name, not fields
            .map(|(k, v)| (k.clone(), json_val_to_fs(v)))
            .collect();
        json!(fields)
    } else {
        json!({})
    }
}

/// Plain JSON value → Firestore field value wrapper.
fn json_val_to_fs(v: &Value) -> Value {
    match v {
        Value::String(s)  => json!({ "stringValue": s }),
        Value::Bool(b)    => json!({ "booleanValue": b }),
        Value::Null       => json!({ "nullValue": null }),
        Value::Number(n)  => {
            if n.is_f64() {
                json!({ "doubleValue": n.as_f64().unwrap() })
            } else {
                json!({ "integerValue": n.to_string() })
            }
        }
        Value::Array(arr) => {
            let values: Vec<_> = arr.iter().map(json_val_to_fs).collect();
            json!({ "arrayValue": { "values": values } })
        }
        Value::Object(obj) => {
            let fields: serde_json::Map<_, _> =
                obj.iter().map(|(k, v)| (k.clone(), json_val_to_fs(v))).collect();
            json!({ "mapValue": { "fields": fields } })
        }
    }
}

// ── Helper ───────────────────────────────────────────────────────────────────

fn firebase_err(status: u16, body: String) -> anyhow::Error {
    // Propagate as a typed error so the route handler can surface proper HTTP status
    anyhow::anyhow!("FIREBASE:{status}:{body}")
}

/// Convert an anyhow error produced by firebase_err() into AppError.
/// Call this in route handlers: `e.into_app_err()`
pub trait IntoAppErr {
    fn into_app_err(self) -> crate::error::AppError;
}

impl IntoAppErr for anyhow::Error {
    fn into_app_err(self) -> crate::error::AppError {
        let msg = self.to_string();
        if let Some(rest) = msg.strip_prefix("FIREBASE:") {
            let mut parts = rest.splitn(2, ':');
            let code: u16 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(502);
            let body = parts.next().unwrap_or("Firebase error").to_string();
            if code == 401 || code == 403 {
                return crate::error::AppError::Unauthorized;
            }
            return crate::error::AppError::Firebase(code, body);
        }
        crate::error::AppError::Internal(self)
    }
}
