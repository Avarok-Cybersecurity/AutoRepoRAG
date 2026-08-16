//! Engine configuration. No implicit defaults: every field is explicit and
//! validated before use (fail fast on nonsense dimensions).

/// HNSW-ish knobs for the fixture engine.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineConfig {
    /// Vector dimensionality. Must be >= 1.
    pub dim: usize,
    /// Search beam width.
    pub ef: usize,
    /// Build-time beam width. Must be >= ef.
    pub ef_construction: usize,
}

impl EngineConfig {
    pub fn validate(&self) -> Result<(), String> {
        if self.dim == 0 {
            return Err("dim must be >= 1".to_string());
        }
        if self.ef == 0 {
            return Err("ef must be >= 1".to_string());
        }
        if self.ef_construction < self.ef {
            return Err(format!(
                "ef_construction ({}) must be >= ef ({})",
                self.ef_construction, self.ef
            ));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::EngineConfig;

    #[test]
    fn zero_dim_is_rejected() {
        let cfg = EngineConfig { dim: 0, ef: 100, ef_construction: 200 };
        assert!(cfg.validate().is_err());
    }

    #[test]
    fn ef_construction_below_ef_is_rejected() {
        let cfg = EngineConfig { dim: 8, ef: 100, ef_construction: 50 };
        assert!(cfg.validate().is_err());
    }
}
