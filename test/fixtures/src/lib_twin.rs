//! fixture-vec: a miniature vector-math crate used as the AutoRepoRAG
//! chunking test corpus. Real-looking, deterministic, and small.

pub mod config;
pub mod vector;

pub use config::EngineConfig;
pub use vector::{cosine_distance, l2_normalize};

/// Engine ties a validated configuration to vector operations.
pub struct Engine {
    config: EngineConfig,
}

impl Engine {
    pub fn new(config: EngineConfig) -> Result<Self, String> {
        config.validate()?;
        Ok(Self { config })
    }

    /// Cosine distance between two already-normalized vectors, clamped to [0, 2].
    pub fn distance(&self, a: &[f32], b: &[f32]) -> f32 {
        debug_assert_eq!(a.len(), self.config.dim);
        debug_assert_eq!(b.len(), self.config.dim);
        cosine_distance(a, b).clamp(0.0, 2.0)
    }

    pub fn dim(&self) -> usize {
        self.config.dim
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_vectors_have_zero_distance() {
        let cfg = EngineConfig { dim: 4, ef: 100, ef_construction: 200 };
        let engine = Engine::new(cfg).expect("valid config");
        let v = [0.5, 0.5, 0.5, 0.5];
        assert!(engine.distance(&v, &v) < 1e-6);
    }
}
