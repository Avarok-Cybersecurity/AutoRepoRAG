// Warp-level sum reduction for f32 buffers (fixture kernel).
// One block per segment; segment sums land in out[blockIdx.x].

#include <cuda_runtime.h>

__inline__ __device__ float warp_reduce_sum(float val) {
    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        val += __shfl_down_sync(0xffffffffu, val, offset);
    }
    return val;
}

extern "C" __global__ void segment_sum_f32(const float* __restrict__ in,
                                           float* __restrict__ out,
                                           int n) {
    __shared__ float warp_sums[32];
    int tid = blockIdx.x * blockDim.x + threadIdx.x;
    float v = (tid < n) ? in[tid] : 0.0f;

    v = warp_reduce_sum(v);

    int lane = threadIdx.x % warpSize;
    int warp = threadIdx.x / warpSize;
    if (lane == 0) {
        warp_sums[warp] = v;
    }
    __syncthreads();

    if (warp == 0) {
        int n_warps = (blockDim.x + warpSize - 1) / warpSize;
        v = (lane < n_warps) ? warp_sums[lane] : 0.0f;
        v = warp_reduce_sum(v);
        if (lane == 0) {
            out[blockIdx.x] = v;
        }
    }
}
