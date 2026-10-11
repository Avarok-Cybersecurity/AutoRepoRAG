// SPDX-License-Identifier: Apache-2.0
// =============================================================================
// chunks-code.mjs — the "code" fixture corpus: ~20 realistic engine-flavored
// chunks (Rust engine + CUDA kernels + docs). path / language / start_line /
// body. Read by make-corpora.mjs; the generated files are committed.
// =============================================================================

export const CODE_CHUNKS = [
  [
    'src/scheduler/batch.rs',
    'rust',
    41,
    `impl BatchScheduler {
    /// Admit waiting requests into the running decode batch. Prefill-heavy
    /// requests are chunked so a long prompt never stalls decode for the
    /// whole batch (chunked prefill, 2048-token slices).
    pub fn admit(&mut self, now: Instant) -> Vec<RequestId> {
        let mut admitted = Vec::new();
        while let Some(req) = self.waiting.peek() {
            if self.kv_pool.free_blocks() < req.blocks_needed() { break; }
            admitted.push(self.waiting.pop().unwrap().id);
        }
        admitted
    }
}`,
  ],
  [
    'src/scheduler/batch.rs',
    'rust',
    88,
    `    /// A request joins the decode batch only once its prefill is complete
    /// and a KV block reservation is held. Preemption evicts the youngest
    /// request first so long-running generations keep their cache.
    fn join_decode(&mut self, id: RequestId) {
        debug_assert!(self.prefill_done.contains(&id));
        self.decode_batch.push(id);
        self.decode_batch.sort_by_key(|r| self.arrival[r]);
    }`,
  ],
  [
    'src/decode/mtp.rs',
    'rust',
    12,
    `//! Multi-token prediction (MTP) speculative decoding.
//! The draft head proposes N tokens per step; the verifier scores them in a
//! single batched forward pass and keeps the longest accepted prefix.
pub struct MtpConfig {
    /// Draft tokens proposed per decode step (2 on GB10 by default).
    pub num_speculative_tokens: usize,
    /// Reject drafts whose verifier logprob falls below this margin.
    pub acceptance_margin: f32,
}`,
  ],
  [
    'src/decode/mtp.rs',
    'rust',
    47,
    `impl MtpEngine {
    /// Keep draft tokens while verifier argmax matches the draft; the first
    /// mismatch truncates the accepted prefix and resamples from the
    /// verifier distribution at that position.
    pub fn accept_prefix(&self, draft: &[TokenId], verified: &[Logits]) -> usize {
        draft.iter().zip(verified).take_while(|(d, v)| v.argmax() == **d).count()
    }
}`,
  ],
  [
    'kernels/nvfp4/gemm_sm121.cu',
    'cuda',
    5,
    `// NVFP4 (E2M1) block-scaled GEMM for GB10 (SM121). SM121 lacks the
// cvt.rn.satfinite.e2m1x2.f32 PTX instruction, so quantization uses a
// software bit-twiddle path (__float_as_uint, shift, mask) before the MMA.
template <int TileM, int TileN, int TileK>
__global__ void nvfp4_gemm_sm121(const uint8_t* __restrict__ a,
                                 const uint8_t* __restrict__ b,
                                 const float* __restrict__ scales,
                                 half* __restrict__ out) {
  constexpr int kWarps = 8; // cooperative schedule, AtomLayout<4,2,1>
  // ...
}`,
  ],
  [
    'kernels/nvfp4/dispatch.rs',
    'rust',
    19,
    `/// Pick the NVFP4 GEMM backend for the current device. GB10 (SM121) routes
/// through the SM120 codepath: CUTLASS block-scaled kernels with the
/// software E2M1 conversion patch; Marlin handles the W4A16 dequant path.
pub fn select_backend(cc: ComputeCapability) -> GemmBackend {
    match (cc.major, cc.minor) {
        (12, 1) | (12, 0) => GemmBackend::CutlassSm120,
        (10, _) => GemmBackend::CutlassSm100,
        _ => GemmBackend::Cublas,
    }
}`,
  ],
  [
    'src/kv/pool.rs',
    'rust',
    30,
    `/// Paged KV cache pool. Blocks are fixed 16-token pages; the FP8 KV path
/// halves bytes per token so a 4k context fits ~2x the sequences.
pub struct KvPool {
    block_bytes: usize,
    free_list: Vec<BlockId>,
    /// Copy-on-write reference counts for prefix-shared blocks.
    refcounts: Vec<u16>,
}`,
  ],
  [
    'src/kv/pool.rs',
    'rust',
    72,
    `impl KvPool {
    pub fn allocate(&mut self, n: usize) -> Option<Vec<BlockId>> {
        if self.free_list.len() < n { return None; }
        Some(self.free_list.split_off(self.free_list.len() - n))
    }
    pub fn release(&mut self, blocks: &[BlockId]) {
        for b in blocks {
            if self.decref(*b) == 0 { self.free_list.push(*b); }
        }
    }
}`,
  ],
  [
    'src/prefill/chunked.rs',
    'rust',
    9,
    `/// Chunked prefill: long prompts are sliced into fixed-size chunks that
/// interleave with decode steps, bounding TTFT for everyone in the batch.
/// The chunk size trades prefill throughput against decode stall time.
pub const PREFILL_CHUNK_TOKENS: usize = 2048;

pub fn plan_chunks(prompt_len: usize) -> impl Iterator<Item = Range<usize>> {
    (0..prompt_len).step_by(PREFILL_CHUNK_TOKENS)
        .map(move |s| s..(s + PREFILL_CHUNK_TOKENS).min(prompt_len))
}`,
  ],
  [
    'src/attention/flash.rs',
    'rust',
    25,
    `/// FlashAttention-style fused attention for SM120/SM121. Softmax runs in
/// registers with an online max/sum rescale; KV loads are staged through
/// shared memory with cp.async double buffering.
pub struct FlashAttnParams {
    pub head_dim: usize,
    pub kv_cache_dtype: KvDtype, // Fp16 | Fp8E4M3
    pub causal: bool,
}`,
  ],
  [
    'src/server/openai.rs',
    'rust',
    140,
    `/// OpenAI-compatible /v1/chat/completions handler. Tool calls are parsed
/// from the model stream with the hermes-format parser; SSE chunks flush on
/// every token so TTFT is one forward pass, not one buffer.
async fn chat_completions(State(engine): State<Engine>, Json(req): Json<ChatRequest>)
    -> Result<Sse<TokenStream>, ApiError> {
    let stream = engine.submit(req.into_generation()?).await?;
    Ok(Sse::new(stream.map(to_chunk)))
}`,
  ],
  [
    'src/server/openai.rs',
    'rust',
    203,
    `/// Streaming tool-call assembly: fragments arrive interleaved with text;
/// the parser tracks brace depth per call id and only emits a tool_call
/// delta once its JSON argument fragment is balanced.
fn assemble_tool_calls(deltas: &mut ToolCallBuffer, frag: &str) -> Vec<ToolCallDelta> {
    deltas.push(frag);
    deltas.drain_balanced()
}`,
  ],
  [
    'src/quant/nvfp4.rs',
    'rust',
    16,
    `/// NVFP4 tensor layout: 4-bit E2M1 values packed two per byte, with one
/// FP8 (E4M3) scale per 16-value block. Weights are pre-swizzled at load
/// time so the GEMM reads scales through TMA without a gather.
pub const NVFP4_BLOCK: usize = 16;

pub fn pack_e2m1(vals: &[f32; NVFP4_BLOCK], scale: f32) -> [u8; NVFP4_BLOCK / 2] {
    let mut out = [0u8; NVFP4_BLOCK / 2];
    for (i, pair) in vals.chunks_exact(2).enumerate() {
        out[i] = encode_e2m1(pair[0] / scale) | (encode_e2m1(pair[1] / scale) << 4);
    }
    out
}`,
  ],
  [
    'src/quant/nvfp4.rs',
    'rust',
    58,
    `/// Software E2M1 encode for SM121: round-to-nearest-even into the 8-value
/// E2M1 lattice {0, .5, 1, 1.5, 2, 3, 4, 6} with saturation, sign in bit 3.
fn encode_e2m1(x: f32) -> u8 {
    let bits = x.to_bits();
    let sign = ((bits >> 31) as u8) << 3;
    let mag = f32::from_bits(bits & 0x7fff_ffff);
    sign | E2M1_TABLE.partition_point(|t| *t < mag).min(7) as u8
}`,
  ],
  [
    'src/engine/mod.rs',
    'rust',
    1,
    `//! Engine core: request lifecycle from tokenize -> prefill -> decode
//! -> detokenize. The engine owns the scheduler, the KV pool, and the model
//! runner; everything above it (HTTP, metrics) is stateless.
pub mod runner;
pub mod sampler;
pub struct Engine {
    scheduler: Mutex<BatchScheduler>,
    runner: ModelRunner,
}`,
  ],
  [
    'src/engine/sampler.rs',
    'rust',
    34,
    `/// Fused sampling: temperature scale, top-k mask, top-p renormalize, then
/// a single Gumbel draw — one kernel launch per decode step for the whole
/// batch instead of four.
pub fn sample_batch(logits: &Tensor, params: &[SamplingParams]) -> Vec<TokenId> {
    fused_sample_kernel(logits, params)
}`,
  ],
  [
    'docs/architecture.md',
    'markdown',
    1,
    `# Engine architecture

The engine is a single-node inference engine for DGX Spark (GB10). The serving
path is: HTTP front door -> tokenizer -> batch scheduler (continuous
batching, chunked prefill) -> model runner (CUDA graphs per batch shape) ->
sampler -> SSE stream. NVFP4 weights ride CUTLASS SM120 kernels with a
software E2M1 conversion, since SM121 lacks the hardware cvt instruction.`,
  ],
  [
    'docs/benchmarks.md',
    'markdown',
    12,
    `## MLPerf-edge agentic reference

The flagship 35B config is gated on webserver_ok 10/10, BFCL subset ST-995
against the recorded baseline, and a warm-TTFT guard (median within 3%) on
any perf-path diff. Decode throughput on GB10 tops out near the LPDDR5X
bandwidth ceiling; MTP speculative decoding is what pushes past it.`,
  ],
  [
    'src/runner/cuda_graph.rs',
    'rust',
    21,
    `/// One captured CUDA graph per (batch_size, num_draft_tokens) shape. Decode
/// replays the graph; a shape miss falls back to eager and captures the new
/// shape in the background so steady state is always graph-replay.
pub struct GraphCache {
    graphs: HashMap<GraphKey, CudaGraphExec>,
    capture_stream: Stream,
}`,
  ],
  [
    'src/ttft/warmup.rs',
    'rust',
    8,
    `/// Warm-path TTFT: the first token cost is dominated by prompt prefill, so
/// the server pre-captures decode graphs and pre-touches KV pages at boot.
/// Cold TTFT is reported separately — never average the two populations.
pub fn warm_boot(engine: &Engine) {
    engine.capture_common_shapes();
    engine.kv_pool_pretouch();
}`,
  ],
];
