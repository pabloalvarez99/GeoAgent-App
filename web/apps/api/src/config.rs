#[derive(Clone, Debug)]
pub struct Config {
    pub firebase_project_id: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            firebase_project_id: std::env::var("FIREBASE_PROJECT_ID")
                .unwrap_or_else(|_| "geoagent-app".to_string()),
            port: std::env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8080),
        }
    }
}
