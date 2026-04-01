use std::net::SocketAddr;
use tower_http::{cors::{Any, CorsLayer}, trace::TraceLayer};

mod auth;
mod config;
mod error;
mod firestore;
mod routes;

#[tokio::main]
async fn main() {
    // Load .env if present (dev only)
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "geoagent_api=debug,tower_http=info".into()),
        )
        .init();

    let cfg = config::Config::from_env();
    tracing::info!("Firebase project: {}", cfg.firebase_project_id);

    let fs = firestore::FirestoreClient::new(cfg.firebase_project_id.clone());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = axum::Router::new()
        .nest("/api/v1", routes::router())
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(fs);

    let addr = SocketAddr::from(([0, 0, 0, 0], cfg.port));
    tracing::info!("GeoAgent API listening on http://{addr}");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
