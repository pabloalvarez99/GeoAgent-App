use axum::{routing::{delete, get, patch, post}, Router};
use crate::firestore::FirestoreClient;

pub mod drillholes;
pub mod intervals;
pub mod lithologies;
pub mod photos;
pub mod projects;
pub mod samples;
pub mod stations;
pub mod structural;

pub fn router() -> Router<FirestoreClient> {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        // Projects
        .route("/projects",     get(projects::list).post(projects::create))
        .route("/projects/:id", get(projects::get_one).patch(projects::update).delete(projects::del))
        // Stations
        .route("/stations",     get(stations::list).post(stations::create))
        .route("/stations/:id", get(stations::get_one).patch(stations::update).delete(stations::del))
        // Lithologies
        .route("/lithologies",     get(lithologies::list).post(lithologies::create))
        .route("/lithologies/:id", get(lithologies::get_one).patch(lithologies::update).delete(lithologies::del))
        // Structural data
        .route("/structural",     get(structural::list).post(structural::create))
        .route("/structural/:id", get(structural::get_one).patch(structural::update).delete(structural::del))
        // Samples
        .route("/samples",     get(samples::list).post(samples::create))
        .route("/samples/:id", get(samples::get_one).patch(samples::update).delete(samples::del))
        // Drill holes
        .route("/drillholes",     get(drillholes::list).post(drillholes::create))
        .route("/drillholes/:id", get(drillholes::get_one).patch(drillholes::update).delete(drillholes::del))
        // Drill intervals
        .route("/intervals",     get(intervals::list).post(intervals::create))
        .route("/intervals/:id", get(intervals::get_one).patch(intervals::update).delete(intervals::del))
        // Photos
        .route("/photos",     get(photos::list).post(photos::create))
        .route("/photos/:id", get(photos::get_one).delete(photos::del))
}
