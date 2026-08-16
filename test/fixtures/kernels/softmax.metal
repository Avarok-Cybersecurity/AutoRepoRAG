// Numerically-stable row softmax (fixture kernel).
// One threadgroup per row; max-subtraction before exponentiation.

#include <metal_stdlib>
using namespace metal;

kernel void row_softmax(device const float* in [[buffer(0)]],
                        device float* out [[buffer(1)]],
                        constant uint& cols [[buffer(2)]],
                        uint row [[threadgroup_position_in_grid]],
                        uint lane [[thread_position_in_threadgroup]],
                        uint lanes [[threads_per_threadgroup]]) {
    device const float* src = in + row * cols;
    device float* dst = out + row * cols;

    float local_max = -INFINITY;
    for (uint c = lane; c < cols; c += lanes) {
        local_max = max(local_max, src[c]);
    }
    float row_max = simd_max(local_max);

    float local_sum = 0.0f;
    for (uint c = lane; c < cols; c += lanes) {
        float e = exp(src[c] - row_max);
        dst[c] = e;
        local_sum += e;
    }
    float row_sum = simd_sum(local_sum);

    for (uint c = lane; c < cols; c += lanes) {
        dst[c] /= row_sum;
    }
}
