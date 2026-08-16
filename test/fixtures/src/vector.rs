//! Dense f32 vector primitives: normalization and cosine distance.
//! Distances follow the LatticeDB convention: 0.0 means identical.

/// L2-normalize in place. Zero vectors are left untouched (norm 0 guard).
pub fn l2_normalize(v: &mut [f32]) {
    let norm = v.iter().map(|x| x * x).sum::<f32>().sqrt();
    if norm == 0.0 {
        return;
    }
    for x in v.iter_mut() {
        *x /= norm;
    }
}

/// Dot product of equal-length slices.
fn dot(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).sum()
}

/// Cosine DISTANCE (not similarity): 1 - cos(a, b).
/// Inputs are assumed normalized; callers own that invariant.
pub fn cosine_distance(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len(), "length mismatch");
    1.0 - dot(a, b)
}

/// Squared Euclidean distance, occasionally handy for tie-breaking.
pub fn l2_squared(a: &[f32], b: &[f32]) -> f32 {
    assert_eq!(a.len(), b.len(), "length mismatch");
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| {
            let d = x - y;
            d * d
        })
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_makes_unit_length() {
        let mut v = vec![3.0, 4.0];
        l2_normalize(&mut v);
        let norm: f32 = v.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((norm - 1.0).abs() < 1e-6);
    }

    #[test]
    fn self_distance_is_zero() {
        let mut v = vec![1.0, 2.0, 2.0];
        l2_normalize(&mut v);
        assert!(cosine_distance(&v, &v).abs() < 1e-6);
    }

    #[test]
    fn zero_vector_survives_normalize() {
        let mut v = vec![0.0, 0.0, 0.0];
        l2_normalize(&mut v);
        assert_eq!(v, vec![0.0, 0.0, 0.0]);
    }
}
