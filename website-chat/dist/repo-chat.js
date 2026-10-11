//#region node_modules/svelte/src/internal/shared/utils.js
var e = Array.isArray, t = Array.prototype.indexOf, n = Array.prototype.includes, r = Array.from, i = Object.defineProperty, a = Object.getOwnPropertyDescriptor, o = Object.getOwnPropertyDescriptors, s = Object.prototype, c = Array.prototype, l = Object.getPrototypeOf, u = Object.isExtensible, d = () => {};
function f(e) {
	for (var t = 0; t < e.length; t++) e[t]();
}
function p() {
	var e, t;
	return {
		promise: new Promise((n, r) => {
			e = n, t = r;
		}),
		resolve: e,
		reject: t
	};
}
var m = 1024, h = 2048, g = 4096, _ = 8192, v = 16384, y = 32768, b = 1 << 25, x = 65536, S = 1 << 19, ee = 1 << 20, te = 1 << 25, C = 65536, ne = 1 << 21, re = 1 << 22, ie = 1 << 23, ae = Symbol("$state"), oe = Symbol(""), se = Symbol("attributes"), ce = Symbol("class"), le = Symbol("style"), ue = Symbol("text"), de = Symbol("form reset"), fe = new class extends Error {
	name = "StaleReactionError";
	message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), pe = !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml");
//#endregion
//#region node_modules/svelte/src/internal/client/errors.js
function me() {
	throw Error("https://svelte.dev/e/async_derived_orphan");
}
function he(e, t, n) {
	throw Error("https://svelte.dev/e/each_key_duplicate");
}
function ge(e) {
	throw Error("https://svelte.dev/e/effect_in_teardown");
}
function _e() {
	throw Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function ve(e) {
	throw Error("https://svelte.dev/e/effect_orphan");
}
function ye() {
	throw Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function be() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function xe() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Se() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function Ce() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/constants.js
var we = {}, w = Symbol("uninitialized"), Te = "http://www.w3.org/1999/xhtml", Ee = "http://www.w3.org/2000/svg", De = "http://www.w3.org/1998/Math/MathML";
function Oe() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function ke(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function Ae() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var T = !1;
function je(e) {
	T = e;
}
var E;
function D(e) {
	if (e === null) throw ke(), we;
	return E = e;
}
function Me() {
	return D(/* @__PURE__ */ en(E));
}
function O(e) {
	if (T) {
		if (/* @__PURE__ */ en(E) !== null) throw ke(), we;
		E = e;
	}
}
function Ne(e = 1) {
	if (T) {
		for (var t = e, n = E; t--;) n = /* @__PURE__ */ en(n);
		E = n;
	}
}
function Pe(e = !0) {
	for (var t = 0, n = E;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ en(n);
		e && n.remove(), n = i;
	}
}
function Fe(e) {
	if (!e || e.nodeType !== 8) throw ke(), we;
	return e.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function Ie(e) {
	return e === this.v;
}
function Le(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function Re(e) {
	return !Le(e, this.v);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var k = null;
function ze(e) {
	k = e;
}
function Be(e, t = !1, n) {
	k = {
		p: k,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: H,
		l: null
	};
}
function Ve(e) {
	var t = k, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) pn(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, k = t.p, e ?? {};
}
function He() {
	return !0;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var Ue = [];
function We() {
	var e = Ue;
	Ue = [], f(e);
}
function Ge(e) {
	if (Ue.length === 0 && !wt) {
		var t = Ue;
		queueMicrotask(() => {
			t === Ue && We();
		});
	}
	Ue.push(e);
}
function Ke() {
	for (; Ue.length > 0;) We();
}
function qe(e) {
	var t = H;
	if (t === null) return V.f |= ie, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	Je(e, t);
}
function Je(e, t) {
	if (!(t !== null && t.f & 16384)) {
		for (; t !== null;) {
			if (t.f & 128) {
				if (!(t.f & 32768)) throw e;
				try {
					t.b.error(e);
					return;
				} catch (t) {
					e = t;
				}
			}
			t = t.parent;
		}
		throw e;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/status.js
var Ye = ~(h | g | m);
function A(e, t) {
	e.f = e.f & Ye | t;
}
function Xe(e) {
	e.f & 512 || e.deps === null ? A(e, m) : A(e, g);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function Ze(e) {
	if (e !== null) for (let t of e) t.f & 2 && t.f & 65536 && (t.f ^= C, Ze(t.deps));
}
function Qe(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), Ze(e.deps), A(e, m);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var $e = !1;
function et() {
	$e || ($e = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[de]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function tt(e) {
	var t = V, n = H;
	Fn(null), In(null);
	try {
		return e();
	} finally {
		Fn(t), In(n);
	}
}
function nt(e, t, n, r = n) {
	e.addEventListener(t, () => tt(n));
	let i = e[de];
	e[de] = i ? () => {
		i(), r(!0);
	} : () => r(!0), et();
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function rt(e) {
	let t = 0, n = Vt(0), r;
	return () => {
		un() && (G(n), _n(() => (t === 0 && (r = tr(() => e(() => Kt(n)))), t += 1, () => {
			Ge(() => {
				--t, t === 0 && (r?.(), r = void 0, Kt(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var it = x | S;
function at(e, t, n, r) {
	new ot(e, t, n, r);
}
var ot = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = T ? E : null;
	#n;
	#r;
	#i;
	#a = null;
	#o = null;
	#s = null;
	#c = null;
	#l = 0;
	#u = 0;
	#d = !1;
	#f = /* @__PURE__ */ new Set();
	#p = /* @__PURE__ */ new Set();
	#m = null;
	#h = rt(() => (this.#m = Vt(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = H;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = H.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = vn(() => {
			if (T) {
				let e = this.#t;
				Me();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, it), T && (this.#e = E);
	}
	#g() {
		try {
			this.#a = yn(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		Ge(r), t && (this.#s = yn(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			t ? Ae() : (t = !0, n && Ce(), this.#s !== null && Tn(this.#s, () => {
				this.#s = null;
			}), this.#S(() => {
				this.#b();
			}));
		};
		return {
			reset: r,
			invoke_onerror: () => {
				try {
					n = !0, this.#n.onerror?.(e, r), n = !1;
				} catch (e) {
					Je(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = yn(() => e(this.#e)), Ge(() => {
			var e = this.#c = document.createDocumentFragment(), t = F();
			e.append(t), this.#a = this.#S(() => yn(() => this.#r(t))), this.#u === 0 && (this.#e.before(e), this.#c = null, Tn(this.#o, () => {
				this.#o = null;
			}), this.#x(M));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = yn(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				kn(this.#a, e);
				let t = this.#n.pending;
				this.#o = yn(() => t(this.#e));
			} else this.#x(M);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		Qe(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = H, n = V, r = k;
		In(this.#i), Fn(this.#i), ze(this.#i.ctx);
		try {
			return At.ensure(), e();
		} catch (e) {
			return qe(e), null;
		} finally {
			In(t), Fn(n), ze(r);
		}
	}
	#C(e, t) {
		this.has_pending_snippet() ? (this.#u += e, this.#u === 0 && (this.#x(t), this.#o && Tn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null))) : this.parent && this.parent.#C(e, t);
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, Ge(() => {
			this.#d = !1, this.#m && Ut(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), G(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		M?.is_fork ? (this.#a && M.skip_effect(this.#a), this.#o && M.skip_effect(this.#o), this.#s && M.skip_effect(this.#s), M.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (B(this.#a), null), this.#o &&= (B(this.#o), null), this.#s &&= (B(this.#s), null), T && (D(this.#t), Ne(), D(Pe()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return yn(() => {
						var r = H;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return Je(e, this.#i.parent), null;
				}
			}));
		};
		Ge(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				Je(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => Je(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function st(e, t, n, r) {
	let i = He() ? dt : mt;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = H, c = ct(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				Je(e, s);
			}
			lt();
		}
	}
	var d = ut();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ pt(e))).then(u).catch((e) => Je(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), lt();
	}) : f();
}
function ct() {
	var e = H, t = V, n = k, r = M;
	return function(i = !0) {
		In(e), Fn(t), ze(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function lt(e = !0) {
	In(null), Fn(null), ze(null), e && M?.deactivate();
}
function ut() {
	var e = H, t = e.b, n = M, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function dt(e) {
	var t = 2 | h;
	return H !== null && (H.f |= S), {
		ctx: k,
		deps: null,
		effects: null,
		equals: Ie,
		f: t,
		fn: e,
		reactions: null,
		rv: 0,
		v: w,
		wv: 0,
		parent: H,
		ac: null
	};
}
var ft = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function pt(e, t, n) {
	let r = H;
	r === null && me();
	var i = void 0, a = Vt(w), o = !V, s = /* @__PURE__ */ new Set();
	return gn(() => {
		var t = H, n = p();
		i = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== fe && n.reject(e);
			}).finally(lt);
		} catch (e) {
			n.reject(e), lt();
		}
		var c = M;
		if (o) {
			if (t.f & 32768) var l = ut();
			if (r.b?.is_rendered()) c.async_deriveds.get(t)?.reject(ft);
			else for (let e of s.values()) e.reject(ft);
			s.add(n), c.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), s.delete(n), t !== ft && (c.activate(), t ? (a.f |= ie, Ut(a, t)) : (a.f & 8388608 && (a.f ^= ie), Ut(a, e)), c.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), dn(() => {
		for (let e of s) e.reject(ft);
	}), new Promise((e) => {
		function t(n) {
			function r() {
				n === i ? e(a) : t(i);
			}
			n.then(r, r);
		}
		t(i);
	});
}
/*#__NO_SIDE_EFFECTS__*/
function j(e) {
	let t = /* @__PURE__ */ dt(e);
	return Rn(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function mt(e) {
	let t = /* @__PURE__ */ dt(e);
	return t.equals = Re, t;
}
function ht(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) B(t[n]);
	}
}
function gt(e) {
	var t, n = H, r = e.parent;
	if (!Mn && r !== null && e.v !== w && r.f & 24576) return Oe(), e.v;
	In(r);
	try {
		e.f &= ~C, ht(e), t = Jn(e);
	} finally {
		In(n);
	}
	return t;
}
function _t(e) {
	var t = gt(e);
	!e.equals(t) && (e.wv = Gn(), (!M?.is_fork || e.deps === null) && (M === null ? e.v = t : (M.capture(e, t, !0), xt?.capture(e, t, !0)), e.deps === null)) ? A(e, m) : Mn || (St === null ? Xe(e) : (un() || M?.is_fork) && St.set(e, t));
}
function vt(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && tt(() => {
		t.ac.abort(fe), t.ac = null;
	}), t.fn !== null && (t.teardown = d), Xn(t, 0), xn(t));
}
function yt(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && Zn(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var bt = null, M = null, xt = null, St = null, Ct = null, wt = !1, Tt = !1, Et = null, Dt = null, Ot = 0, kt = 1, At = class e {
	id = kt++;
	#e = !1;
	linked = !0;
	#t = null;
	#n = null;
	async_deriveds = /* @__PURE__ */ new Map();
	current = /* @__PURE__ */ new Map();
	previous = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	#o = /* @__PURE__ */ new Map();
	#s = null;
	#c = [];
	#l = [];
	#u = /* @__PURE__ */ new Set();
	#d = /* @__PURE__ */ new Set();
	#f = /* @__PURE__ */ new Map();
	#p = /* @__PURE__ */ new Set();
	is_fork = !1;
	#m = !1;
	constructor() {
		bt === null ? bt = this : (bt.#n = this, this.#t = bt), bt = this;
	}
	#h() {
		if (this.is_fork) return !0;
		for (let n of this.#o.keys()) {
			for (var e = n, t = !1; e.parent !== null;) {
				if (this.#f.has(e)) {
					t = !0;
					break;
				}
				e = e.parent;
			}
			if (!t) return !0;
		}
		return !1;
	}
	skip_effect(e) {
		this.#f.has(e) || this.#f.set(e, {
			d: [],
			m: []
		}), this.#p.delete(e);
	}
	unskip_effect(e, t = (e) => this.schedule(e)) {
		var n = this.#f.get(e);
		if (n) {
			this.#f.delete(e);
			for (var r of n.d) A(r, h), t(r);
			for (r of n.m) A(r, g), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		this.#e = !0, Ot++ > 1e3 && (this.#x(), Mt());
		for (let e of this.#u) this.#d.delete(e), A(e, h), this.schedule(e);
		for (let e of this.#d) A(e, g), this.schedule(e);
		let t = this.#c;
		this.#c = [], this.apply();
		var n = Et = [], r = [], i = Dt = [];
		for (let e of t) try {
			this.#_(e, n, r);
		} catch (t) {
			throw Lt(e), this.#h() || this.discard(), t;
		}
		if (M = null, i.length > 0) {
			var a = e.ensure();
			for (let e of i) a.schedule(e);
		}
		if (Et = null, Dt = null, this.#h()) {
			this.#b(r), this.#b(n);
			for (let [e, t] of this.#f) It(e, t);
			i.length > 0 && M.#g();
			return;
		}
		let o = this.#v();
		if (o) this.#b(r), this.#b(n), o.#y(this);
		else {
			this.#u.clear(), this.#d.clear();
			for (let e of this.#r) e(this);
			this.#r.clear(), xt = this, Pt(r), Pt(n), xt = null, this.#s?.resolve();
			var s = M;
			if (this.#a === 0 && (this.#c.length === 0 || s !== null) && this.#x(), this.#c.length > 0) {
				if (s !== null) {
					let e = s;
					e.#c.push(...this.#c.filter((t) => !e.#c.includes(t)));
				} else s = this;
			}
			s !== null && s.#g();
		}
	}
	#_(e, t, n) {
		e.f ^= m;
		for (var r = e.first; r !== null;) {
			var i = r.f, a = !!(i & 96);
			if (!(a && i & 1024 || i & 8192 || this.#f.has(r)) && r.fn !== null) {
				a ? r.f ^= m : i & 4 ? t.push(r) : Kn(r) && (i & 16 && this.#d.add(r), Zn(r));
				var o = r.first;
				if (o !== null) {
					r = o;
					continue;
				}
			}
			for (; r !== null;) {
				var s = r.next;
				if (s !== null) {
					r = s;
					break;
				}
				r = r.parent;
			}
		}
	}
	#v() {
		for (var e = this.#t; e !== null;) {
			if (!e.is_fork) {
				for (let [t, [, n]] of this.current) if (e.current.has(t) && !n) return e;
			}
			e = e.#t;
		}
		return null;
	}
	#y(e) {
		for (let [t, n] of e.current) !this.previous.has(t) && e.previous.has(t) && this.previous.set(t, e.previous.get(t)), this.current.set(t, n);
		for (let [t, n] of e.async_deriveds) {
			let e = this.async_deriveds.get(t);
			e && n.promise.then(e.resolve).catch(e.reject);
		}
		e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d);
		let t = (e) => {
			var n = e.reactions;
			if (n !== null && !(e.f & 2 && !(e.f & 6144))) for (let e of n) {
				var r = e.f;
				if (r & 2) t(e);
				else {
					var i = e;
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), A(i, h), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#x(), M = this, this.#g();
	}
	#b(e) {
		for (var t = 0; t < e.length; t += 1) Qe(e[t], this.#u, this.#d);
	}
	capture(e, t, n = !1) {
		e.v !== w && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [t, n]), St?.set(e, t)), this.is_fork || (e.v = t);
	}
	activate() {
		M = this;
	}
	deactivate() {
		M = null, St = null;
	}
	flush() {
		try {
			Tt = !0, M = this, this.#g();
		} finally {
			Ot = 0, Ct = null, Et = null, Dt = null, Tt = !1, M = null, St = null, zt.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(ft);
		this.#x(), this.#s?.resolve();
	}
	register_created_effect(e) {
		this.#l.push(e);
	}
	increment(e, t) {
		if (this.#a += 1, e) {
			let e = this.#o.get(t) ?? 0;
			this.#o.set(t, e + 1);
		}
	}
	decrement(e, t) {
		if (--this.#a, e) {
			let e = this.#o.get(t) ?? 0;
			e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
		}
		this.#m || (this.#m = !0, Ge(() => {
			this.#m = !1, this.linked && this.flush();
		}));
	}
	transfer_effects(e, t) {
		for (let t of e) this.#u.add(t);
		for (let e of t) this.#d.add(e);
		e.clear(), t.clear();
	}
	oncommit(e) {
		this.#r.add(e);
	}
	ondiscard(e) {
		this.#i.add(e);
	}
	settled() {
		return (this.#s ??= p()).promise;
	}
	static ensure() {
		if (M === null) {
			let t = M = new e();
			!Tt && !wt && Ge(() => {
				t.#e || t.flush();
			});
		}
		return M;
	}
	apply() {
		St = null;
	}
	schedule(e) {
		if (Ct = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) e.b.defer_effect(e);
		else {
			for (var t = e; t.parent !== null;) {
				t = t.parent;
				var n = t.f;
				if (Et !== null && t === H && (V === null || !(V.f & 2))) return;
				if (n & 96) {
					if (!(n & 1024)) return;
					t.f ^= m;
				}
			}
			this.#c.push(t);
		}
	}
	#x() {
		if (this.linked) {
			var e = this.#t, t = this.#n;
			e === null || (e.#n = t), t === null ? bt = e : t.#t = e, this.linked = !1;
		}
	}
};
function jt(e) {
	var t = wt;
	wt = !0;
	try {
		var n;
		for (e && (M !== null && !M.is_fork && M.flush(), n = e());;) {
			if (Ke(), M === null) return n;
			M.flush();
		}
	} finally {
		wt = t;
	}
}
function Mt() {
	try {
		ye();
	} catch (e) {
		Je(e, Ct);
	}
}
var Nt = null;
function Pt(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Kn(r) && (Nt = /* @__PURE__ */ new Set(), Zn(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && wn(r), Nt?.size > 0)) {
				zt.clear();
				for (let e of Nt) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) Nt.has(n) && (Nt.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || Zn(n);
					}
				}
				Nt.clear();
			}
		}
		Nt = null;
	}
}
function Ft(e) {
	M.schedule(e);
}
function It(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), A(e, m);
		for (var n = e.first; n !== null;) It(n, t), n = n.next;
	}
}
function Lt(e) {
	A(e, m);
	for (var t = e.first; t !== null;) Lt(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var Rt = /* @__PURE__ */ new Set(), zt = /* @__PURE__ */ new Map(), Bt = !1;
function Vt(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: Ie,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function N(e, t) {
	let n = Vt(e, t);
	return Rn(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function Ht(e, t = !1, n = !0) {
	let r = Vt(e);
	return t || (r.equals = Re), r;
}
function P(e, t, n = !1) {
	return V !== null && (!Pn || V.f & 131072) && He() && V.f & 4325394 && (Ln === null || !Ln.has(e)) && Se(), Ut(e, n ? Jt(t) : t, Dt);
}
function Ut(e, t, n = null) {
	if (!e.equals(t)) {
		zt.set(e, Mn ? t : e.v);
		var r = At.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && gt(t), St === null && Xe(t);
		}
		e.wv = Gn(), qt(e, h, n), He() && H !== null && H.f & 1024 && !(H.f & 96) && (zn === null ? Bn([e]) : zn.push(e)), !r.is_fork && Rt.size > 0 && !Bt && Wt();
	}
	return t;
}
function Wt() {
	Bt = !1;
	for (let e of Rt) {
		e.f & 1024 && A(e, g);
		let t;
		try {
			t = Kn(e);
		} catch {
			t = !0;
		}
		t && Zn(e);
	}
	Rt.clear();
}
function Gt(e, t = 1) {
	var n = G(e), r = t === 1 ? n++ : n--;
	return P(e, n), r;
}
function Kt(e) {
	P(e, e.v + 1);
}
function qt(e, t, n) {
	var r = e.reactions;
	if (r !== null) for (var i = He(), a = r.length, o = 0; o < a; o++) {
		var s = r[o], c = s.f;
		if (i || s !== H) {
			var l = (c & h) === 0;
			if (l && A(s, t), c & 131072) Rt.add(s);
			else if (c & 2) {
				var u = s;
				St?.delete(u), c & 65536 || (c & 512 && (H === null || !(H.f & 2097152)) && (s.f |= C), qt(u, g, n));
			} else if (l) {
				var d = s;
				c & 16 && Nt !== null && Nt.add(d), n === null ? Ft(d) : n.push(d);
			}
		}
	}
}
function Jt(t) {
	if (typeof t != "object" || !t || ae in t) return t;
	let n = l(t);
	if (n !== s && n !== c) return t;
	var r = /* @__PURE__ */ new Map(), i = e(t), o = /* @__PURE__ */ N(0), u = null, d = Un, f = (e) => {
		if (Un === d) return e();
		var t = V, n = Un;
		Fn(null), Wn(d);
		var r = e();
		return Fn(t), Wn(n), r;
	};
	return i && r.set("length", /* @__PURE__ */ N(t.length, u)), new Proxy(t, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && be();
			var i = r.get(t);
			return i === void 0 ? f(() => {
				var e = /* @__PURE__ */ N(n.value, u);
				return r.set(t, e), e;
			}) : P(i, n.value, !0), !0;
		},
		deleteProperty(e, t) {
			var n = r.get(t);
			if (n === void 0) {
				if (t in e) {
					let e = f(() => /* @__PURE__ */ N(w, u));
					r.set(t, e), Kt(o);
				}
			} else P(n, w), Kt(o);
			return !0;
		},
		get(e, n, i) {
			if (n === ae) return t;
			var o = r.get(n), s = n in e;
			if (o === void 0 && (!s || a(e, n)?.writable) && (o = f(() => /* @__PURE__ */ N(Jt(s ? e[n] : w), u)), r.set(n, o)), o !== void 0) {
				var c = G(o);
				return c === w ? void 0 : c;
			}
			return Reflect.get(e, n, i);
		},
		getOwnPropertyDescriptor(e, t) {
			var n = Reflect.getOwnPropertyDescriptor(e, t);
			if (n && "value" in n) {
				var i = r.get(t);
				i && (n.value = G(i));
			} else if (n === void 0) {
				var a = r.get(t), o = a?.v;
				if (a !== void 0 && o !== w) return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return n;
		},
		has(e, t) {
			if (t === ae) return !0;
			var n = r.get(t), i = n !== void 0 && n.v !== w || Reflect.has(e, t);
			return (n !== void 0 || H !== null && (!i || a(e, t)?.writable)) && (n === void 0 && (n = f(() => /* @__PURE__ */ N(i ? Jt(e[t]) : w, u)), r.set(t, n)), G(n) === w) ? !1 : i;
		},
		set(e, t, n, s) {
			var c = r.get(t), l = t in e;
			if (i && t === "length") for (var d = n; d < c.v; d += 1) {
				var p = r.get(d + "");
				p === void 0 ? d in e && (p = f(() => /* @__PURE__ */ N(w, u)), r.set(d + "", p)) : P(p, w);
			}
			if (c === void 0) (!l || a(e, t)?.writable) && (c = f(() => /* @__PURE__ */ N(void 0, u)), P(c, Jt(n)), r.set(t, c));
			else {
				l = c.v !== w;
				var m = f(() => Jt(n));
				P(c, m);
			}
			var h = Reflect.getOwnPropertyDescriptor(e, t);
			if (h?.set && h.set.call(s, n), !l) {
				if (i && typeof t == "string") {
					var g = r.get("length"), _ = Number(t);
					Number.isInteger(_) && _ >= g.v && P(g, _ + 1);
				}
				Kt(o);
			}
			return !0;
		},
		ownKeys(e) {
			G(o);
			var t = Reflect.ownKeys(e).filter((e) => {
				var t = r.get(e);
				return t === void 0 || t.v !== w;
			});
			for (var [n, i] of r) i.v !== w && !(n in e) && t.push(n);
			return t;
		},
		setPrototypeOf() {
			xe();
		}
	});
}
var Yt, Xt, Zt, Qt;
function $t() {
	if (Yt === void 0) {
		Yt = window, Xt = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		Zt = a(t, "firstChild").get, Qt = a(t, "nextSibling").get, u(e) && (e[ce] = void 0, e[se] = null, e[le] = void 0, e.__e = void 0), u(n) && (n[ue] = void 0);
	}
}
function F(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function I(e) {
	return Zt.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function en(e) {
	return Qt.call(e);
}
function L(e, t) {
	if (!T) return /* @__PURE__ */ I(e);
	var n = /* @__PURE__ */ I(E);
	if (n === null) n = E.appendChild(F());
	else if (t && n.nodeType !== 3) {
		var r = F();
		return n?.before(r), D(r), r;
	}
	return t && on(n), D(n), n;
}
function tn(e, t = !1) {
	if (!T) {
		var n = /* @__PURE__ */ I(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ en(n) : n;
	}
	if (t) {
		if (E?.nodeType !== 3) {
			var r = F();
			return E?.before(r), D(r), r;
		}
		on(E);
	}
	return E;
}
function R(e, t = 1, n = !1) {
	let r = T ? E : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ en(r);
	if (!T) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = F();
			return r === null ? i?.after(a) : r.before(a), D(a), a;
		}
		on(r);
	}
	return D(r), r;
}
function nn(e) {
	e.textContent = "";
}
function rn() {
	return !1;
}
function an(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function on(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/effects.js
function sn(e) {
	H === null && (V === null && ve(e), _e()), Mn && ge(e);
}
function cn(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function ln(e, t) {
	var n = H;
	n !== null && n.f & 8192 && (e |= _);
	var r = {
		ctx: k,
		deps: null,
		nodes: null,
		f: e | h | 512,
		first: null,
		fn: t,
		last: null,
		next: null,
		parent: n,
		b: n && n.b,
		prev: null,
		teardown: null,
		wv: 0,
		ac: null
	};
	M?.register_created_effect(r);
	var i = r;
	if (e & 4) Et === null ? At.ensure().schedule(r) : Et.push(r);
	else if (t !== null) {
		try {
			Zn(r);
		} catch (e) {
			throw B(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= x));
	}
	if (i !== null && (i.parent = n, n !== null && cn(i, n), V !== null && V.f & 2 && !(e & 64))) {
		var a = V;
		(a.effects ??= []).push(i);
	}
	return r;
}
function un() {
	return V !== null && !Pn;
}
function dn(e) {
	let t = ln(8, null);
	return A(t, m), t.teardown = e, t;
}
function fn(e) {
	sn("$effect");
	var t = H.f;
	if (!V && t & 32 && k !== null && !k.i) {
		var n = k;
		(n.e ??= []).push(e);
	} else return pn(e);
}
function pn(e) {
	return ln(4 | ee, e);
}
function mn(e) {
	At.ensure();
	let t = ln(64 | S, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? Tn(t, () => {
			B(t), n(void 0);
		}) : (B(t), n(void 0));
	});
}
function hn(e) {
	return ln(4, e);
}
function gn(e) {
	return ln(re | S, e);
}
function _n(e, t = 0) {
	return ln(8 | t, e);
}
function z(e, t = [], n = [], r = []) {
	st(r, t, n, (t) => {
		ln(8, () => {
			e(...t.map(G));
		});
	});
}
function vn(e, t = 0) {
	return ln(16 | t, e);
}
function yn(e) {
	return ln(32 | S, e);
}
function bn(e) {
	var t = e.teardown;
	if (t !== null) {
		let e = Mn, n = V;
		Nn(!0), Fn(null);
		try {
			t.call(null);
		} finally {
			Nn(e), Fn(n);
		}
	}
}
function xn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && tt(() => {
			e.abort(fe);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : B(n, t), n = r;
	}
}
function Sn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || B(t), t = n;
	}
}
function B(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Cn(e.nodes.start, e.nodes.end), n = !0), e.f |= b, xn(e, t && !n), Xn(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	bn(e), e.f ^= b, e.f |= v;
	var i = e.parent;
	i !== null && i.first !== null && wn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Cn(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ en(e);
		e.remove(), e = n;
	}
}
function wn(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Tn(e, t, n = !0) {
	var r = [];
	En(e, r, !0);
	var i = () => {
		n && B(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function En(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= _;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				En(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function Dn(e) {
	On(e, !0);
}
function On(e, t) {
	if (e.f & 8192) {
		e.f ^= _, e.f & 1024 || (A(e, h), At.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			On(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function kn(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ en(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var An = null, jn = !1, Mn = !1;
function Nn(e) {
	Mn = e;
}
var V = null, Pn = !1;
function Fn(e) {
	V = e;
}
var H = null;
function In(e) {
	H = e;
}
var Ln = null;
function Rn(e) {
	V !== null && (Ln ??= /* @__PURE__ */ new Set()).add(e);
}
var U = null, W = 0, zn = null;
function Bn(e) {
	zn = e;
}
var Vn = 1, Hn = 0, Un = Hn;
function Wn(e) {
	Un = e;
}
function Gn() {
	return ++Vn;
}
function Kn(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 2 && (e.f &= ~C), t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Kn(a) && _t(a), a.wv > e.wv) return !0;
		}
		t & 512 && St === null && A(e, m);
	}
	return !1;
}
function qn(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(Ln !== null && Ln.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? qn(a, t, !1) : t === a && (n ? A(a, h) : a.f & 1024 && A(a, g), Ft(a));
	}
}
function Jn(e) {
	var t = U, n = W, r = zn, i = V, a = Ln, o = k, s = Pn, c = Un, l = e.f;
	U = null, W = 0, zn = null, V = l & 96 ? null : e, Ln = null, ze(e.ctx), Pn = !1, Un = ++Hn, e.ac !== null && (tt(() => {
		e.ac.abort(fe);
	}), e.ac = null);
	try {
		e.f |= ne;
		var u = e.fn, d = u();
		e.f |= y;
		var f = e.deps, p = M?.is_fork;
		if (U !== null) {
			var m;
			if (p || Xn(e, W), f !== null && W > 0) for (f.length = W + U.length, m = 0; m < U.length; m++) f[W + m] = U[m];
			else e.deps = f = U;
			if (un() && e.f & 512) for (m = W; m < f.length; m++) (f[m].reactions ??= []).push(e);
		} else !p && f !== null && W < f.length && (Xn(e, W), f.length = W);
		if (He() && zn !== null && !Pn && f !== null && !(e.f & 6146)) for (m = 0; m < zn.length; m++) qn(zn[m], e);
		if (i !== null && i !== e) {
			if (Hn++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = Hn;
			if (t !== null) for (let e of t) e.rv = Hn;
			zn !== null && (r === null ? r = zn : r.push(...zn));
		}
		return e.f & 8388608 && (e.f ^= ie), d;
	} catch (e) {
		return qe(e);
	} finally {
		e.f ^= ne, U = t, W = n, zn = r, V = i, Ln = a, ze(o), Pn = s, Un = c;
	}
}
function Yn(e, r) {
	let i = r.reactions;
	if (i !== null) {
		var a = t.call(i, e);
		if (a !== -1) {
			var o = i.length - 1;
			o === 0 ? i = r.reactions = null : (i[a] = i[o], i.pop());
		}
	}
	if (i === null && r.f & 2 && (U === null || !n.call(U, r))) {
		var s = r;
		s.f & 512 && (s.f ^= 512, s.f &= ~C), s.v !== w && Xe(s), s.ac !== null && tt(() => {
			s.ac.abort(fe), s.ac = null, A(s, h);
		}), vt(s), Xn(s, 0);
	}
}
function Xn(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Yn(e, n[r]);
}
function Zn(e) {
	var t = e.f;
	if (!(t & 16384)) {
		A(e, m);
		var n = H, r = jn;
		H = e, jn = !(t & 96);
		try {
			t & 16777232 ? Sn(e) : xn(e), bn(e);
			var i = Jn(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = Vn;
		} finally {
			jn = r, H = n;
		}
	}
}
async function Qn() {
	await Promise.resolve(), jt();
}
function G(e) {
	var t = !!(e.f & 2);
	if (An?.add(e), V !== null && !Pn && !(H !== null && H.f & 16384) && (Ln === null || !Ln.has(e))) {
		var r = V.deps;
		if (V.f & 2097152) e.rv < Hn && (e.rv = Hn, U === null && r !== null && r[W] === e ? W++ : U === null ? U = [e] : U.push(e));
		else {
			V.deps ??= [], n.call(V.deps, e) || V.deps.push(e);
			var i = e.reactions;
			i === null ? e.reactions = [V] : n.call(i, V) || i.push(V);
		}
	}
	if (Mn && zt.has(e)) return zt.get(e);
	if (t) {
		var a = e;
		if (Mn) {
			var o = a.v;
			return (!(a.f & 1024) && a.reactions !== null || er(a)) && (o = gt(a)), zt.set(a, o), o;
		}
		var s = !(a.f & 512) && !Pn && V !== null && (jn || !!(V.f & 512)), c = (a.f & y) === 0;
		Kn(a) && (s && (a.f |= 512), _t(a)), s && !c && (yt(a), $n(a));
	}
	if (St?.has(e)) return St.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function $n(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (yt(t), $n(t));
}
function er(e) {
	if (e.v === w) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (zt.has(t) || t.f & 2 && er(t)) return !0;
	return !1;
}
function tr(e) {
	var t = Pn;
	try {
		return Pn = !0, e();
	} finally {
		Pn = t;
	}
}
[.../* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split(".")];
var nr = ["touchstart", "touchmove"];
function rr(e) {
	return nr.includes(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
var ir = Symbol("events"), ar = /* @__PURE__ */ new Set(), or = /* @__PURE__ */ new Set();
function sr(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || fr.call(t, e), !e.cancelBubble) return tt(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Ge(() => {
		t.addEventListener(e, i, r);
	}) : t.addEventListener(e, i, r), i;
}
function cr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = sr(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && dn(() => {
		t.removeEventListener(e, o, a);
	});
}
function lr(e, t, n) {
	(t[ir] ??= {})[e] = n;
}
function ur(e) {
	for (var t = 0; t < e.length; t++) ar.add(e[t]);
	for (var n of or) n(e);
}
var dr = null;
function fr(e) {
	var t = this, n = t.ownerDocument, r = e.type, a = e.composedPath?.() || [], o = a[0] || e.target;
	dr = e;
	var s = 0, c = dr === e && e[ir];
	if (c) {
		var l = a.indexOf(c);
		if (l !== -1 && (t === document || t === window)) {
			e[ir] = t;
			return;
		}
		var u = a.indexOf(t);
		if (u === -1) return;
		l <= u && (s = l);
	}
	if (o = a[s] || e.target, o !== t) {
		i(e, "currentTarget", {
			configurable: !0,
			get() {
				return o || n;
			}
		});
		var d = V, f = H;
		Fn(null), In(null);
		try {
			for (var p, m = []; o !== null && o !== t;) {
				try {
					var h = o[ir]?.[r];
					h != null && (!o.disabled || e.target === o) && h.call(o, e);
				} catch (e) {
					p ? m.push(e) : p = e;
				}
				if (e.cancelBubble) break;
				s++, o = s < a.length ? a[s] : null;
			}
			if (p) {
				for (let e of m) queueMicrotask(() => {
					throw e;
				});
				throw p;
			}
		} finally {
			e[ir] = t, delete e.currentTarget, Fn(d), In(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var pr = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function mr(e) {
	return pr?.createHTML(e) ?? e;
}
function hr(e) {
	var t = an("template");
	return t.innerHTML = mr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function K(e, t) {
	var n = H;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function q(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (T) return K(E, null), E;
		i === void 0 && (i = hr(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ I(i)));
		var t = r || Xt ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ I(t), s = t.lastChild;
			K(o, s);
		} else K(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function gr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (T) return K(E, null), E;
		if (!o) {
			var e = /* @__PURE__ */ I(hr(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ I(e);) o.appendChild(/* @__PURE__ */ I(e));
			else o = /* @__PURE__ */ I(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ I(t), r = t.lastChild;
			K(n, r);
		} else K(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function _r(e, t) {
	return /* @__PURE__ */ gr(e, t, "svg");
}
function vr(e = "") {
	if (!T) {
		var t = F(e + "");
		return K(t, t), t;
	}
	var n = E;
	return n.nodeType === 3 ? on(n) : (n.before(n = F()), D(n)), K(n, n), n;
}
function yr() {
	if (T) return K(E, null), E;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = F();
	return e.append(t, n), K(t, n), e;
}
function J(e, t) {
	if (T) {
		var n = H;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = E), Me();
	} else e !== null && e.before(t);
}
function Y(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ue] ??= e.nodeValue) && (e[ue] = n, e.nodeValue = `${n}`);
}
function br(e, t) {
	return Sr(e, t);
}
var xr = /* @__PURE__ */ new Map();
function Sr(e, { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	$t();
	var l = void 0, u = mn(() => {
		var s = n ?? t.appendChild(F());
		at(s, { pending: () => {} }, (t) => {
			Be({});
			var n = k;
			if (o && (n.c = o), a && (i.$$events = a), T && K(t, null), l = e(t, i) || {}, T && (H.nodes.end = E, E === null || E.nodeType !== 8 || E.data !== "]")) throw ke(), we;
			Ve();
		}, c);
		var u = /* @__PURE__ */ new Set(), d = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!u.has(r)) {
					u.add(r);
					var i = rr(r);
					for (let e of [t, document]) {
						var a = xr.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), xr.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, fr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return d(r(ar)), or.add(d), () => {
			for (var e of u) for (let n of [t, document]) {
				var r = xr.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, fr), r.delete(e), r.size === 0 && xr.delete(n)) : r.set(e, i);
			}
			or.delete(d), s !== n && s.parentNode?.removeChild(s);
		};
	});
	return Cr.set(l, u), l;
}
var Cr = /* @__PURE__ */ new WeakMap();
function wr(e, t) {
	let n = Cr.get(e);
	return n ? (Cr.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var Tr = class {
	anchor;
	#e = /* @__PURE__ */ new Map();
	#t = /* @__PURE__ */ new Map();
	#n = /* @__PURE__ */ new Map();
	#r = /* @__PURE__ */ new Set();
	#i = !0;
	constructor(e, t = !0) {
		this.anchor = e, this.#i = t;
	}
	#a = (e) => {
		if (this.#e.has(e)) {
			var t = this.#e.get(e), n = this.#t.get(t);
			if (n) Dn(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (Dn(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (B(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						kn(r, t), t.append(F()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else B(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Tn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (B(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = M, r = rn();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = F();
				i.append(a), this.#n.set(e, {
					effect: yn(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, yn(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else T && (this.anchor = E), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function X(e, t, n = !1) {
	var r;
	T && (r = E, Me());
	var i = new Tr(e), a = n ? x : 0;
	function o(e, t) {
		if (T) {
			var n = Fe(r);
			if (e !== parseInt(n.substring(1))) {
				var a = Pe();
				D(a), i.anchor = a, je(!1), i.ensure(e, t), je(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	vn(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function Er(e, t) {
	return t;
}
function Dr(e, t, n) {
	for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
		let n = t[c];
		Tn(n, () => {
			if (o) {
				if (o.pending.delete(n), o.done.add(n), o.pending.size === 0) {
					var t = e.outrogroups;
					Or(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = i.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			nn(d), d.append(u), e.items.clear();
		}
		Or(e, t, !l);
	} else o = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function Or(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= te, kn(a, document.createDocumentFragment())) : B(t[i], n);
	}
}
var kr;
function Ar(t, n, i, a, o, s = null) {
	var c = t, l = /* @__PURE__ */ new Map();
	if (n & 4) {
		var u = t;
		c = T ? D(/* @__PURE__ */ I(u)) : u.appendChild(F());
	}
	T && Me();
	var d = null, f = /* @__PURE__ */ mt(() => {
		var t = i();
		return e(t) ? t : t == null ? [] : r(t);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Mr(v, p, c, n, a), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= te, Pr(d, null, c)) : Dn(d) : Tn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: vn(() => {
			p = G(f);
			var e = p.length;
			let t = !1;
			T && Fe(c) === "[!" != (e === 0) && (c = Pe(), D(c), je(!1), t = !0);
			for (var r = /* @__PURE__ */ new Set(), u = M, v = rn(), y = 0; y < e; y += 1) {
				T && E.nodeType === 8 && E.data === "]" && (c = E, t = !0, je(!1));
				var b = p[y], x = a(b, y), S = h ? null : l.get(x);
				S ? (S.v && Ut(S.v, b), S.i && Ut(S.i, y), v && u.unskip_effect(S.e)) : (S = Nr(l, h ? c : kr ??= F(), b, x, y, o, n, i), h || (S.e.f |= te), l.set(x, S)), r.add(x);
			}
			if (e === 0 && s && !d && (h ? d = yn(() => s(c)) : (d = yn(() => s(kr ??= F())), d.f |= te)), e > r.size && he("", "", ""), T && e > 0 && D(Pe()), !h) {
				if (m.set(u, r), v) {
					for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			t && je(!0), G(f);
		}),
		flags: n,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, T && (c = E);
}
function jr(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Mr(e, t, n, i, a) {
	var o = !!(i & 8), s = t.length, c = e.items, l = jr(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (o) for (v = 0; v < s; v += 1) h = t[v], g = a(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = a(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (Dn(_), o && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= te, _ === l) Pr(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Fr(e, d, _), Fr(e, _, y), Pr(_, y, n), d = _, p = [], m = [], l = jr(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], ee = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Pr(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Fr(e, S.prev, ee.next), Fr(e, d, S), Fr(e, ee, b), l = b, d = ee, --v, p = [], m = [];
				} else u.delete(_), Pr(_, l, n), Fr(e, _.prev, _.next), Fr(e, _, d === null ? e.effect.first : d.next), Fr(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = jr(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = jr(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Or(e, r(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var C = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || C.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && C.push(l), l = jr(l.next);
		var ne = C.length;
		if (ne > 0) {
			var re = i & 4 && s === 0 ? n : null;
			if (o) {
				for (v = 0; v < ne; v += 1) C[v].nodes?.a?.measure();
				for (v = 0; v < ne; v += 1) C[v].nodes?.a?.fix();
			}
			Dr(e, C, re);
		}
	}
	o && Ge(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Nr(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Vt(n) : /* @__PURE__ */ Ht(n, !1, !1) : null, l = o & 2 ? Vt(i) : null;
	return {
		v: c,
		i: l,
		e: yn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Pr(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ en(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Fr(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Ir(e, t, n = !1, r = !1, i = !1, a = !1) {
	var o = e, s = "";
	if (n) {
		var c = e;
		T && (o = D(/* @__PURE__ */ I(c)));
	}
	z(() => {
		var e = H;
		if (s === (s = t() ?? "")) T && Me();
		else if (n && !T) e.nodes = null, c.innerHTML = s, s !== "" && K(/* @__PURE__ */ I(c), c.lastChild);
		else if (e.nodes !== null && (Cn(e.nodes.start, e.nodes.end), e.nodes = null), s !== "") {
			if (T) {
				for (var a = E.data, l = Me(), u = l; l !== null && (l.nodeType !== 8 || l.data !== "");) u = l, l = /* @__PURE__ */ en(l);
				if (l === null) throw ke(), we;
				K(E, u), o = D(l);
			} else {
				var d = an(r ? "svg" : i ? "math" : "template", r ? Ee : i ? De : void 0);
				d.innerHTML = s;
				var f = r || i ? d : d.content;
				if (K(/* @__PURE__ */ I(f), f.lastChild), r || i) for (; /* @__PURE__ */ I(f);) o.before(/* @__PURE__ */ I(f));
				else o.before(f);
			}
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
var Lr = [..." 	\n\r\f\xA0\v﻿"];
function Rr(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Lr.includes(r[o - 1])) && (s === r.length || Lr.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function zr(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Br(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Vr(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Br)), i && c.push(...Object.keys(i).map(Br));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Br(e.substring(l, u).trim());
							if (!c.includes(p)) {
								f !== ";" && d++;
								var m = e.substring(l, d).trim();
								n += " " + m + ";";
							}
						}
						l = d + 1, u = -1;
					}
				}
			}
		}
		return r && (n += zr(r)), i && (n += zr(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Hr(e, t, n, r, i, a) {
	var o = e[ce];
	if (T || o !== n || o === void 0) {
		var s = Rr(n, r, a);
		(!T || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[ce] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Ur(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function Wr(e, t, n, r) {
	var i = e[le];
	if (T || i !== t) {
		var a = Vr(t, r);
		(!T || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[le] = t;
	} else r && (Array.isArray(r) ? (Ur(e, n?.[0], r[0]), Ur(e, n?.[1], r[1], "important")) : Ur(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var Gr = Symbol("is custom element"), Kr = Symbol("is html"), qr = pe ? "link" : "LINK";
function Jr(e) {
	if (T) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					Z(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					Z(e, "checked", null), e.checked = r;
				}
			}
		};
		e[de] = n, Ge(n), et();
	}
}
function Z(e, t, n, r) {
	var i = Yr(e);
	T && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === qr) || i[t] !== (i[t] = n) && (t === "loading" && (e[oe] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Zr(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Yr(e) {
	return e[se] ??= {
		[Gr]: e.nodeName.includes("-"),
		[Kr]: e.namespaceURI === Te
	};
}
var Xr = /* @__PURE__ */ new Map();
function Zr(e) {
	var t = e.getAttribute("is") || e.nodeName, n = Xr.get(t);
	if (n) return n;
	Xr.set(t, n = []);
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var s in r = o(i), r) r[s].set && s !== "innerHTML" && s !== "textContent" && s !== "innerText" && n.push(s);
		i = l(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function Qr(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	nt(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = $r(e) ? ei(a) : a, n(a), M !== null && r.add(M), await Qn(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (T && e.defaultValue !== e.value || tr(t) == null && e.value) && (n($r(e) ? ei(e.value) : e.value), M !== null && r.add(M)), _n(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = M;
			if (r.has(i)) return;
		}
		$r(e) && n === ei(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function $r(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function ei(e) {
	return e === "" ? null : +e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function ti(e, t) {
	return e === t || e?.[ae] === t;
}
function ni(e = {}, t, n, r) {
	var i = k.r, a = H;
	return hn(() => {
		var o, s;
		return _n(() => {
			o = s, s = r?.() || [], tr(() => {
				ti(n(...s), e) || (t(e, ...s), o && ti(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && ti(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region src/copy-en.js
function ri(e) {
	if (e && typeof e == "object") {
		for (let t of Object.values(e)) ri(t);
		Object.freeze(e);
	}
	return e;
}
var ii = ri({
	navLabel: "Ask the codebase",
	closeLabel: "Close ask the codebase",
	label: "// ask the codebase",
	title: "Ask the codebase.",
	sub: "This repository is embedded into a vector lattice that runs right here in your browser. Ask a question, get an answer with file and line receipts.",
	boot: [
		"code lattice online",
		"retrieval runs locally in wasm, only the model call leaves this page",
		"pick a question or type your own"
	],
	corpusLine: "{id}: {chunks} chunks from {files} files at {commit}",
	starters: [
		"Where does a request enter this codebase?",
		"How is configuration loaded and validated?",
		"Which modules talk to the network?"
	],
	key: {
		tag: "openrouter key",
		lead: "Answers come from free models on OpenRouter, so you bring your own key. It stays in this browser and we never see it.",
		linkText: "grab a free key at openrouter.ai/keys",
		url: "https://openrouter.ai/keys",
		placeholder: "sk-or-v1-...",
		inputLabel: "OpenRouter API key",
		reveal: "show",
		conceal: "hide",
		save: "connect",
		connectedTag: "connected",
		connectedNote: "key stored in this browser only",
		change: "swap key"
	},
	status: {
		idle: "standby",
		"wasm-init": "starting engine",
		manifest: "fetching manifest",
		"loading-cached": "reading local cache",
		downloading: "downloading corpus",
		caching: "writing local cache",
		indexing: "indexing",
		ready: "ready",
		error: "fault"
	},
	pill: {
		corpora: "{n} corpora",
		chunks: "{n} chunks",
		dim: "dim {n}"
	},
	progress: {
		bytes: "{loaded} of {total} MB",
		count: "{done} of {total}",
		size: "{total} MB"
	},
	offlineBadge: "cached · offline",
	phase: {
		retrieving: "searching the lattice",
		reranking: "reranking matches",
		thinking: "reasoning",
		writing: "writing"
	},
	trace: {
		label: "reasoning",
		reasonedPrefix: "reasoned for",
		show: "show",
		hide: "hide"
	},
	loader: {
		title: "mounting the code lattice",
		sizeLabel: "download",
		chunksLabel: "chunks",
		stages: {
			"wasm-init": "start the wasm engine",
			manifest: "fetch the corpus manifest",
			corpus: "load the corpus",
			indexing: "index the chunks"
		},
		cancelNote: "close anytime, the download cancels cleanly and nothing partial is kept"
	},
	input: {
		placeholder: "ask about anything in the repo",
		ask: "ask",
		hintLoading: "the corpus is still mounting, hang tight",
		hintNoKey: "connect your OpenRouter key above to ask",
		fine: "answers are generated and can be wrong, the source links are real so read them before you trust them"
	},
	answerTag: "answer",
	sourcesHeading: "source receipts",
	sourcesOne: "source",
	sourcesMany: "sources",
	model: {
		label: "answer model",
		reset: "back to free"
	},
	errors: {
		wasm: {
			tag: "engine fault",
			body: "The wasm engine failed to start. Usually a one off, a retry brings it right up.",
			retry: "restart engine"
		},
		manifest: {
			tag: "manifest unreachable",
			body: "Could not reach the corpus manifest. Check your connection and retry.",
			retry: "retry"
		},
		corpus: {
			tag: "download failed",
			body: "The corpus download did not finish. Nothing partial was kept, retry whenever.",
			retry: "retry download"
		},
		decompress: {
			tag: "unpack failed",
			body: "Your browser could not unpack the corpus stream. Any current Chrome, Edge, Firefox or Safari handles it.",
			retry: "retry"
		},
		config: {
			tag: "corpus mismatch",
			body: "The published corpora do not fit together, so this site needs a rebuild. Retrying will not help.",
			retry: "retry"
		},
		rate: {
			tag: "rate limited",
			body: "The free OpenRouter models are catching their breath. Give it a few seconds.",
			retry: "ask again"
		},
		quota: {
			tag: "daily limit reached",
			body: "Your OpenRouter key has spent its free model allowance for today. Retrieval still runs locally so the corpus stays loaded and ready.",
			reset: "The free pool refills at",
			paid: "switch to the paid model and spend my own credits",
			retry: "ask again"
		},
		key: {
			tag: "key rejected",
			body: "OpenRouter did not accept that key. Paste a fresh one and reconnect.",
			retry: "swap key"
		},
		generic: {
			tag: "hiccup",
			body: "That one did not go through. Retry in a moment.",
			retry: "retry"
		}
	}
}), ai = Object.freeze([
	"bg",
	"bg2",
	"card",
	"border",
	"borderStrong",
	"text",
	"text2",
	"text3",
	"accent",
	"accentSoft",
	"onAccent",
	"green",
	"amber",
	"fontMono",
	"fontSans",
	"shadowLg"
]);
function oi(e) {
	return `--arr-${e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`;
}
function si(e) {
	return ai.map((t) => [oi(t), e[t]]);
}
//#endregion
//#region src/config/validate.js
var ci = class extends Error {
	constructor(e) {
		super(`openRepoChat: invalid config (${e.length} problem${e.length === 1 ? "" : "s"}):\n${e.map((e) => `  - ${e}`).join("\n")}`), this.name = "ConfigError", this.problems = e;
	}
}, li = /^[a-z0-9][a-z0-9_-]{0,63}$/, ui = /^[A-Za-z0-9._-]{1,64}$/, di = /^https?:\/\/[^\s/]+/, fi = /\{(\w+)\}/g, pi = (e) => typeof e == "object" && !!e && !Array.isArray(e) && Object.getPrototypeOf(e) === Object.prototype, Q = (e) => typeof e == "string" && e.trim() !== "" ? null : "must be a non-empty string", mi = (e) => Q(e) ?? (di.test(e) ? null : "must be an absolute http(s) URL"), hi = (e) => (t) => Number.isSafeInteger(t) && t >= e ? null : `must be an integer >= ${e}`, gi = (e) => typeof e == "string" && ui.test(e) ? null : "must be 1-64 characters of [A-Za-z0-9._-]", _i = (e) => e === null || typeof e == "string" && /^\s*<svg[\s>]/.test(e) && /<\/svg>\s*$/.test(e) ? null : "must be null (no watermark) or a complete <svg>...</svg> string", vi = (e) => typeof e == "object" && e && e.nodeType === 1 && typeof e.appendChild == "function" ? null : "must be a DOM Element", yi = (e) => typeof e == "function" ? null : "must be a function", $ = (e) => ({
	kind: "leaf",
	check: e
}), bi = (e) => ({
	kind: "leaf",
	check: e,
	optional: !0
}), xi = (e) => ({
	kind: "object",
	fields: e
}), Si = xi({
	mount: $(vi),
	assets: xi({ cssHref: $(Q) }),
	wasm: xi({
		jsUrl: $(Q),
		binUrl: $(Q)
	}),
	corpora: { kind: "corpora" },
	provider: xi({
		apiUrl: $(mi),
		rerankModel: $(Q),
		chatModel: $(Q),
		appTitle: $(Q),
		referer: $(mi),
		maxAttempts: $(hi(1)),
		retryBaseMs: $(hi(0))
	}),
	retrieval: xi({
		topK: $(hi(1)),
		rerankMultiplier: $(hi(1)),
		upsertBatch: $(hi(1))
	}),
	storage: xi({ keyPrefix: $(gi) }),
	copy: { kind: "copy" },
	brand: xi({
		productName: $(Q),
		motifSvg: $(_i)
	}),
	theme: xi(Object.fromEntries(ai.map((e) => [e, $(Q)]))),
	onReady: bi(yi),
	onClose: bi(yi)
});
function Ci(e, t, n, r) {
	if (e.kind === "leaf") {
		if (t === void 0) {
			e.optional || r.push(`${n}: missing`);
			return;
		}
		let i = e.check(t);
		i && r.push(`${n}: ${i}`);
		return;
	}
	if (e.kind === "corpora") return wi(t, n, r);
	if (e.kind === "copy") return Ei(ii, t, n, r);
	t !== void 0 && !pi(t) && (r.push(`${n}: must be an object`), t = void 0);
	let i = t ?? {};
	for (let [t, a] of Object.entries(e.fields)) Ci(a, i[t], n ? `${n}.${t}` : t, r);
	for (let t of Object.keys(i)) t in e.fields || r.push(`${n ? `${n}.` : ""}${t}: unknown key`);
}
function wi(e, t, n) {
	if (e === void 0) {
		n.push(`${t}: missing (a non-empty array of { id, gzUrl, metaUrl })`);
		return;
	}
	if (!Array.isArray(e) || e.length === 0) {
		n.push(`${t}: must be a non-empty array of { id, gzUrl, metaUrl }`);
		return;
	}
	let r = /* @__PURE__ */ new Set();
	e.forEach((e, i) => {
		let a = `${t}[${i}]`;
		Ci(xi({
			id: $((e) => typeof e == "string" && li.test(e) ? null : "must match /^[a-z0-9][a-z0-9_-]{0,63}$/"),
			gzUrl: $(Q),
			metaUrl: $(Q)
		}), e, a, n);
		let o = pi(e) ? e.id : void 0;
		typeof o == "string" && (r.has(o) && n.push(`${a}.id: duplicate corpus id ${JSON.stringify(o)}`), r.add(o));
	});
}
function Ti(e) {
	return [...e.matchAll(fi)].map((e) => e[1]);
}
function Ei(e, t, n, r) {
	if (t === void 0) r.push(`${n}: missing (start from COPY_EN: { ...COPY_EN, ... })`);
	else if (typeof e == "string") {
		let i = Q(t);
		if (i) {
			r.push(`${n}: ${i}`);
			return;
		}
		let a = new Set(Ti(e));
		for (let e of Ti(t)) a.has(e) || r.push(`${n}: unknown placeholder {${e}} (allowed: ${[...a].map((e) => `{${e}}`).join(" ") || "none"})`);
	} else if (Array.isArray(e)) (!Array.isArray(t) || t.some((e) => Q(e) !== null)) && r.push(`${n}: must be an array of non-empty strings`);
	else if (!pi(t)) r.push(`${n}: must be an object`);
	else {
		for (let [i, a] of Object.entries(e)) Ei(a, t[i], `${n}.${i}`, r);
		for (let i of Object.keys(t)) i in e || r.push(`${n}.${i}: unknown key`);
	}
}
function Di(e) {
	let t = [];
	if (pi(e) ? Ci(Si, e, "", t) : (t.push("config: must be a plain object"), Ci(Si, void 0, "", t)), t.length > 0) throw new ci(t);
	return e;
}
//#endregion
//#region src/adapters/browser.js
function Oi() {
	return new Promise((e) => {
		typeof requestIdleCallback == "function" ? requestIdleCallback(() => e(), { timeout: 100 }) : setTimeout(e, 0);
	});
}
var ki = (e) => new Promise((t) => setTimeout(t, e)), Ai = {
	now: () => performance.now(),
	requestFrame: (e) => requestAnimationFrame(e),
	cancelFrame: (e) => cancelAnimationFrame(e)
}, ji = (e) => typeof window < "u" && window.matchMedia(e).matches, Mi = (e, t) => globalThis.fetch(e, t), Ni = (e) => import(
	/* @vite-ignore */
	e
), Pi = () => typeof navigator < "u" && navigator.storage?.getDirectory ? () => navigator.storage.getDirectory() : null;
function Fi(e) {
	let t = [...document.querySelectorAll("link[rel=\"stylesheet\"][data-repo-chat]")].find((t) => t.getAttribute("href") === e);
	if (t?.dataset.repoChat === "loaded") return Promise.resolve();
	let n = t ?? document.createElement("link"), r = new Promise((t, r) => {
		n.addEventListener("load", () => {
			n.dataset.repoChat = "loaded", t();
		}, { once: !0 }), n.addEventListener("error", () => r(/* @__PURE__ */ Error(`stylesheet ${e} failed to load`)), { once: !0 });
	});
	return t || (n.rel = "stylesheet", n.href = e, n.dataset.repoChat = "pending", document.head.appendChild(n)), r;
}
function Ii() {
	let e = typeof navigator < "u" ? navigator.connection : void 0;
	return !e || !(e.saveData || typeof e.effectiveType == "string" && /(^|-)2g$/.test(e.effectiveType));
}
var Li = /* @__PURE__ */ new Set();
function Ri(e, t) {
	if (Li.has(e) || typeof window > "u" || typeof caches > "u" || !Ii()) return;
	Li.add(e);
	let n = async () => {
		try {
			let n = await caches.open(t);
			if (await n.match(e)) return;
			let r = await fetch(e, { priority: "low" });
			r.ok && await n.put(e, r);
		} catch {
			Li.delete(e);
		}
	};
	typeof requestIdleCallback == "function" ? requestIdleCallback(() => void n(), { timeout: 4e3 }) : setTimeout(() => void n(), 2e3);
}
//#endregion
//#region src/adapters/corpus.js
function zi(e) {
	async function t(t) {
		let n = await e.fetch(t, { cache: "no-cache" });
		if (!n.ok) throw Error(`manifest fetch failed: HTTP ${n.status}`);
		return n.json();
	}
	async function n(t, n) {
		let r = await e.fetch(t, { signal: n });
		if (!r.ok) throw Error(`corpus fetch failed: HTTP ${r.status}`);
		if (!r.body) throw Error("corpus fetch returned no body stream");
		let i = Number(r.headers.get("content-length"));
		return {
			body: r.body,
			contentLength: Number.isFinite(i) && i > 0 ? i : null
		};
	}
	function r(e) {
		return typeof DecompressionStream == "function" ? e.pipeThrough(new DecompressionStream("gzip")) : null;
	}
	return {
		fetchMeta: t,
		openCorpus: n,
		gunzip: r
	};
}
//#endregion
//#region src/adapters/lattice.js
function Bi(e, t) {
	if (e && e.status === "ok" && e.result !== void 0) return e.result;
	throw Error(`${t} failed: ${e && e.error || "unknown wasm error"}`);
}
function Vi(e, t) {
	let n = null, r = null;
	function i() {
		return n ? Promise.resolve(n) : r || (r = (async () => {
			let r = await t.importModule(e.jsUrl);
			try {
				await r.default({ module_or_path: e.binUrl });
			} catch {
				let n = await t.fetch(e.binUrl);
				if (!n.ok) throw Error(`wasm fetch failed: HTTP ${n.status}`);
				await r.default({ module_or_path: await n.arrayBuffer() });
			}
			return n = new r.LatticeDB(), n;
		})(), r.catch(() => {
			r = null;
		}), r);
	}
	function a() {
		if (!n) throw Error("LatticeDB wasm not initialized — call init() first");
		return n;
	}
	function o() {
		let e = Bi(a().listCollections(), "listCollections");
		return Array.isArray(e) ? e.map((e) => typeof e == "string" ? e : e?.name) : (e?.collections ?? []).map((e) => e.name);
	}
	function s(e, t) {
		let n = a();
		o().includes(e) && n.deleteCollection(e);
		let r = n.createCollection(e, { vectors: {
			size: t,
			distance: "Cosine"
		} });
		if (!r || r.status !== "ok" || r.result !== !0) throw Error(`createCollection failed: ${r && r.error || "unknown wasm error"}`);
	}
	function c(e, t) {
		return Bi(a().upsert(e, t), "upsert");
	}
	function l(e, t, n) {
		return Bi(a().search(e, new Float32Array(t), n, { with_payload: !0 }), "search");
	}
	return {
		init: i,
		createCollection: s,
		upsert: c,
		search: l
	};
}
//#endregion
//#region src/adapters/openrouter.js
var Hi = class extends Error {
	constructor(e, t, { quota: n = !1, resetAt: r = null } = {}) {
		super(e), this.name = "OpenRouterError", this.transient = t, this.quota = n, this.resetAt = r;
	}
}, Ui = /free-models-per-day|per-?day|daily/i;
function Wi(e, t) {
	let n = e?.metadata ?? {}, r = String(n.limit_source ?? ""), i = String(e?.message ?? "");
	if (!Ui.test(r) && !Ui.test(i)) return null;
	let a = n.headers?.["X-RateLimit-Reset"] ?? t?.headers?.get?.("X-RateLimit-Reset"), o = Number(a);
	return { resetAt: Number.isFinite(o) && o > 0 ? o : null };
}
function Gi(e, t, n) {
	return new Hi(`${e} failed: ${t}`, !1, {
		quota: !0,
		resetAt: n.resetAt
	});
}
var Ki = /ResourceExhausted|rate.?limit|overloaded/i;
async function qi(e, t) {
	let n = await e.text();
	if (!e.ok) {
		let r = null;
		try {
			r = JSON.parse(n);
		} catch {}
		let i = e.status === 429 ? Wi(r?.error, e) : null;
		throw i ? Gi(t, r.error.message ?? "daily limit reached", i) : new Hi(`${t} failed: ${e.status} - ${n}`, e.status === 429 || e.status >= 500);
	}
	let r;
	try {
		r = JSON.parse(n);
	} catch {
		throw new Hi(`${t} returned invalid JSON: ${n.slice(0, 200)}`, !1);
	}
	let i = r?.error;
	if (i) {
		let n = i.code ?? 0, r = i.message ?? "unknown error", a = Wi(i, e);
		throw a ? Gi(t, r, a) : new Hi(`${t} failed${n ? ` (${n})` : ""}: ${r}`, n === 429 || n >= 500 || Ki.test(r));
	}
	return r;
}
function Ji(e) {
	if (typeof e.reasoning == "string" && e.reasoning) return e.reasoning;
	if (Array.isArray(e.reasoning_details)) {
		let t = "";
		for (let n of e.reasoning_details) typeof n?.text == "string" ? t += n.text : typeof n?.summary == "string" && (t += n.summary);
		if (t) return t;
	}
}
async function Yi(e, t) {
	let n = e.getReader(), r = new TextDecoder(), i = "";
	try {
		for (;;) {
			let { done: e, value: a } = await n.read();
			if (e) break;
			i += r.decode(a, { stream: !0 });
			let o;
			for (; (o = i.indexOf("\n")) !== -1;) {
				let e = i.slice(0, o).trim();
				if (i = i.slice(o + 1), e === "" || e.startsWith(":") || !e.startsWith("data:")) continue;
				let n = e.slice(5).trim();
				if (n === "[DONE]") return;
				let r;
				try {
					r = JSON.parse(n);
				} catch {
					continue;
				}
				if (r.error) {
					let e = r.error.message ?? "unknown error", t = Wi(r.error, null);
					throw t ? Gi("Chat request", e, t) : new Hi(`Chat request failed: ${e}`, r.error.code === 429 || (r.error.code ?? 0) >= 500 || Ki.test(e));
				}
				let a = r.choices?.[0]?.delta;
				if (!a) continue;
				let s = Ji(a), c = typeof a.content == "string" && a.content ? a.content : void 0;
				(s || c) && t(s, c);
			}
		}
	} finally {
		n.releaseLock?.();
	}
}
function Xi(e, t) {
	let { apiUrl: n, appTitle: r, referer: i, maxAttempts: a, retryBaseMs: o } = e, s = (e) => ({
		Authorization: `Bearer ${e}`,
		"Content-Type": "application/json",
		"HTTP-Referer": i,
		"X-Title": r
	}), c = (e) => t.sleep(o * 2 ** (e - 1));
	async function l(e) {
		let t;
		for (let n = 1; n <= a; n++) try {
			return await e();
		} catch (e) {
			if (t = e, !(e instanceof Hi && e.transient) || n === a) break;
			await c(n);
		}
		throw t;
	}
	let u = (e, r, i) => t.fetch(`${n}${e}`, {
		method: "POST",
		headers: s(r),
		body: i
	});
	async function d(e, t, n) {
		if (e.length === 0) return [];
		let r = await l(async () => qi(await u("/embeddings", t, JSON.stringify({
			model: n,
			input: e
		})), "Embedding request"));
		if (!Array.isArray(r?.data)) throw new Hi("Embedding request returned no embeddings.", !1);
		return r.data.slice().sort((e, t) => e.index - t.index).map((e) => e.embedding);
	}
	async function f(e, t, n) {
		let [r] = await d([e], t, n);
		return r;
	}
	async function p(e, t, n, { onDelta: r, model: i }) {
		let o = JSON.stringify({
			model: i,
			messages: [{
				role: "system",
				content: t
			}, ...e],
			stream: !0
		}), s = "", l = !1, d = (e, t) => {
			l = !0, t && (s += t), r({
				reasoning: e,
				content: t
			});
		}, f = async () => {
			let e = await u("/chat/completions", n, o), t = e.headers.get("content-type") ?? "";
			if (!e.ok || !t.includes("text/event-stream")) {
				let t = (await qi(e, "Chat request")).choices?.[0]?.message?.content;
				if (t === void 0) throw Error("Chat request returned no message content");
				d(void 0, t);
			} else {
				if (!e.body) throw new Hi("Chat request returned no response stream", !0);
				await Yi(e.body, d);
			}
		};
		for (let e = 1;; e++) try {
			return await f(), s;
		} catch (t) {
			if (!(t instanceof Hi && t.transient) || l || e >= a) throw t;
			await c(e);
		}
	}
	async function m(e, t, n, r, i) {
		let a = await l(async () => qi(await u("/rerank", n, JSON.stringify({
			model: i,
			query: e,
			documents: t,
			top_n: r,
			return_documents: !1
		})), "Rerank request"));
		if (!Array.isArray(a?.results)) throw new Hi("Rerank request returned no results.", !1);
		return a.results.slice().sort((e, t) => t.relevance_score - e.relevance_score).map((e) => ({
			index: e.index,
			score: e.relevance_score
		}));
	}
	return {
		getEmbeddings: d,
		getEmbedding: f,
		chat: p,
		rerank: m
	};
}
//#endregion
//#region src/core/cache-names.js
var Zi = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function Qi(e, t, n) {
	return `${e}~${t}@${n}.jsonl`;
}
function $i(e, t, n) {
	return `${e}~${t}@${n}.meta.json`;
}
function ea(e, t, n) {
	let r = RegExp(`^${Zi(`${e}~${t}@`)}([0-9a-f]{7,64})\\.jsonl$`).exec(n);
	return r ? r[1] : null;
}
function ta(e, t, n) {
	let r = RegExp(`^${Zi(`${e}~${t}@`)}([0-9a-f]{7,64})\\.meta\\.json$`).exec(n);
	return r ? r[1] : null;
}
//#endregion
//#region src/adapters/opfs.js
function na(e, t) {
	async function n() {
		if (!t.getDirectory) return null;
		try {
			return await t.getDirectory();
		} catch {
			return null;
		}
	}
	async function r(t, r, i) {
		let a = await n();
		if (!a) return null;
		try {
			let n = await (await a.getFileHandle(Qi(e, t, r))).getFile();
			return i !== null && n.size !== i ? null : n;
		} catch {
			return null;
		}
	}
	async function i(t, r) {
		let i = await n();
		if (!i) return null;
		let a = Qi(e, t, r), o;
		try {
			o = await (await i.getFileHandle(a, { create: !0 })).createWritable({ keepExistingData: !1 });
		} catch {
			return null;
		}
		let s = !0;
		return {
			async write(e) {
				s && await o.write(e);
			},
			async finalize() {
				s && (s = !1, await o.close());
			},
			async discard() {
				s && (s = !1, await o.abort().catch(() => void 0), await i.removeEntry(a).catch(() => void 0));
			}
		};
	}
	async function a(t, r, i) {
		let a = await n();
		if (a) try {
			let n = await (await a.getFileHandle($i(e, t, r), { create: !0 })).createWritable({ keepExistingData: !1 });
			await n.write(JSON.stringify(i)), await n.close();
		} catch {}
	}
	async function o(t, n) {
		let r = [];
		try {
			for await (let [i, a] of t) {
				if (a.kind !== "file") continue;
				let t = ea(e, n, i), o = t ? null : ta(e, n, i);
				if (t || o) try {
					let e = await a.getFile();
					r.push({
						name: i,
						sha: t ?? o,
						kind: t ? "corpus" : "meta",
						lastModified: e.lastModified,
						file: e
					});
				} catch {}
			}
		} catch {
			return r;
		}
		return r;
	}
	async function s(e) {
		let t = await n();
		if (!t) return null;
		let r = await o(t, e), i = new Map(r.filter((e) => e.kind === "meta").map((e) => [e.sha, e.file])), a = r.filter((e) => e.kind === "corpus" && i.has(e.sha)).sort((e, t) => t.lastModified - e.lastModified);
		for (let e of a) try {
			return {
				sha: e.sha,
				file: e.file,
				rawMeta: JSON.parse(await i.get(e.sha).text())
			};
		} catch {}
		return null;
	}
	async function c(e, t) {
		if (typeof t != "string" || t === "") return;
		let r = await n();
		if (r) for (let n of await o(r, e)) n.sha !== t && await r.removeEntry(n.name).catch(() => void 0);
	}
	return {
		getCachedCorpus: r,
		createCorpusWriter: i,
		writeMeta: a,
		newestOffline: s,
		pruneStale: c
	};
}
//#endregion
//#region src/adapters/storage.js
function ra(e, t) {
	let n = `${e}openrouter-key`, r = `${e}openrouter-chat-model`;
	return {
		keyName: n,
		modelName: r,
		getKey: () => t.getItem(n),
		setKey: (e) => t.setItem(n, e),
		clearKey: () => t.removeItem(n),
		getChatModel: () => t.getItem(r),
		setChatModel: (e) => t.setItem(r, e),
		clearChatModel: () => t.removeItem(r)
	};
}
//#endregion
//#region src/core/ask-errors.js
function ia(e) {
	let t = String(e?.message ?? e);
	return e?.quota ? {
		kind: "quota",
		resetAt: e.resetAt ?? null
	} : /\b401\b|\b403\b|invalid.{0,20}key|no auth/i.test(t) ? {
		kind: "key",
		resetAt: null
	} : /dimensions but this corpus/.test(t) ? {
		kind: "corpus",
		resetAt: null
	} : {
		kind: "rate",
		resetAt: null
	};
}
function aa(e) {
	return /gzip|decompress|inflate|corrupt/i.test(String(e?.message)) ? "decompress" : "corpus";
}
//#endregion
//#region src/core/prompt.js
function oa(e) {
	return Math.max(0, Math.min(100, (1 - e) * 100));
}
function sa(e, t, n, r, i) {
	return `https://github.com/${e}/blob/${t}/${n}#L${r}-L${i}`;
}
function ca(e, { repo: t, path: n, startLine: r, endLine: i, language: a, text: o }) {
	return `[${e}] ${t} ${n} lines ${r}–${i}\n\`\`\`${a || ""}\n${o}\n\`\`\``;
}
function la(e) {
	return e.map((e) => `GitHub repository ${e.repo}, commit ${e.commit}`).join("; ");
}
function ua(e, t, n) {
	return `You are the code assistant for the ${e} codebase (${la(t)}). Answer questions about this codebase using ONLY the numbered code context below.\n\nRules:\n- Cite the context blocks you draw from inline with bracketed numbers, e.g. [1] or [2].\n- If the context does not contain what is needed to answer, say plainly that the retrieved code does not cover it. Never invent file names, functions, or behavior.\n- Be concise and technical. Prefer short code excerpts over prose when they answer better.\n\nContext:\n${n}`;
}
var da = "No relevant code was found in the corpus for this question.";
//#endregion
//#region src/core/rag.js
function fa(e, t) {
	return e.flatMap(({ corpus: e, hits: t }) => t.map((t) => ({
		corpus: e,
		id: Number(t.id),
		score: t.score,
		payload: t.payload ?? {}
	})).filter((e) => typeof e.payload.text == "string")).sort((e, t) => e.score - t.score).slice(0, t);
}
function pa(e, t, n) {
	return e.slice(0, n).filter(({ index: e }) => Number.isInteger(e) && e >= 0 && e < t.length).map(({ index: e }) => t[e]);
}
function ma(e, t) {
	let n = e.payload, r = Number(n.start_line), i = Number(n.end_line);
	return {
		n: t,
		corpusId: e.corpus.id,
		repo: e.corpus.repo,
		path: n.path,
		startLine: r,
		endLine: i,
		score: e.score,
		relevancePct: oa(e.score),
		url: sa(e.corpus.repo, e.corpus.commit, n.path, r, i)
	};
}
async function ha(e, t, n) {
	let { openrouter: r, lattice: i, corpora: a, embedding: o, retrieval: s, productName: c, rerankModel: l, chatModel: u, apiKey: d, onPhase: f, onDelta: p } = n;
	f("retrieving");
	let m = await r.getEmbedding(e, d, o.model);
	if (!Array.isArray(m) || m.length !== o.dim) throw Error(`The embedding model returned ${m?.length ?? 0} dimensions but this corpus was built with ${o.dim}. The site's embedding model and the published corpus are out of sync — the corpus needs a rebuild against the current model.`);
	let h = s.topK * s.rerankMultiplier, g = fa(a.map((e) => ({
		corpus: e,
		hits: i.search(e.collection, m, h)
	})), h), _;
	g.length > 1 ? (f("reranking"), _ = pa(await r.rerank(e, g.map((e) => e.payload.text), d, s.topK, l), g, s.topK)) : _ = g.slice(0, s.topK);
	let v = _.map((e, t) => ma(e, t + 1)), y = _.length > 0 ? _.map((e, t) => ca(t + 1, {
		repo: e.corpus.repo,
		path: e.payload.path,
		startLine: Number(e.payload.start_line),
		endLine: Number(e.payload.end_line),
		language: e.payload.language,
		text: e.payload.text
	})).join("\n\n") : da;
	return f("thinking"), {
		answer: await r.chat([...t, {
			role: "user",
			content: e
		}], ua(c, a, y), d, {
			onDelta: p,
			model: u
		}),
		sources: v
	};
}
//#endregion
//#region src/core/jsonl.js
function ga(e, t) {
	let n;
	try {
		n = JSON.parse(e);
	} catch {
		throw Error("corpus is not lattice-jsonl (missing header line)");
	}
	if (n?.t !== "header" || n?.format !== "lattice-jsonl") throw Error("corpus is not lattice-jsonl (missing header line)");
	if (!Number.isSafeInteger(n.dim) || n.dim < 1) throw Error("corpus header carries no valid dim");
	if (t !== null && n.dim !== t) throw Error(`corpus header says ${n.dim} dimensions but the manifest says ${t} — the published corpus and manifest disagree`);
	return n;
}
function _a(e) {
	let t = JSON.parse(e);
	return t?.t === "point" ? {
		id: t.id,
		vector: t.vector,
		payload: t.payload
	} : null;
}
function va(e) {
	let t = "";
	return {
		async push(n) {
			t += n;
			let r;
			for (; (r = t.indexOf("\n")) !== -1;) {
				let n = t.slice(0, r).trim();
				t = t.slice(r + 1), n !== "" && await e(n);
			}
		},
		async end() {
			let n = t.trim();
			t = "", n !== "" && await e(n);
		}
	};
}
//#endregion
//#region src/core/manifest.js
var ya = /^[0-9a-f]{7,64}$/, ba = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, xa = (e) => Number.isSafeInteger(e) && e >= 0;
function Sa(e, t) {
	let n = (e) => /* @__PURE__ */ Error(`corpus "${t}" manifest: ${e}`);
	if (typeof e != "object" || !e || Array.isArray(e)) throw n("is not a JSON object");
	if (typeof e.commit_sha != "string" || !ya.test(e.commit_sha)) throw n("commit_sha must be a hex commit string");
	if (!Number.isSafeInteger(e.dim) || e.dim < 1) throw n("dim must be a positive integer");
	if (typeof e.model != "string" || e.model.trim() === "") throw n("model must name the embedding model");
	if (typeof e.repo != "string" || !ba.test(e.repo)) throw n("repo must be \"owner/name\"");
	for (let t of [
		"points",
		"files",
		"bytes",
		"gz_bytes"
	]) if (!xa(e[t])) throw n(`${t} must be a non-negative integer`);
	if (typeof e.generated_at != "string") throw n("generated_at must be a string");
	return {
		commitSha: e.commit_sha,
		dim: e.dim,
		model: e.model,
		repo: e.repo,
		points: e.points,
		files: e.files,
		bytes: e.bytes,
		gzBytes: e.gz_bytes,
		generatedAt: e.generated_at
	};
}
function Ca(e) {
	if (e.length === 0) throw Error("no corpora to load");
	let [t, ...n] = e;
	for (let e of n) {
		if (e.meta.model !== t.meta.model) throw Error(`corpora disagree on the embedding model: "${t.id}" was built with ${t.meta.model} but "${e.id}" with ${e.meta.model}. One question embedding cannot search both; rebuild them with one model.`);
		if (e.meta.dim !== t.meta.dim) throw Error(`corpora disagree on the embedding dimension: "${t.id}" has ${t.meta.dim} but "${e.id}" has ${e.meta.dim}.`);
	}
	return {
		model: t.meta.model,
		dim: t.meta.dim
	};
}
//#endregion
//#region src/state/loader.js
var wa = class extends Error {
	constructor() {
		super("load aborted"), this.name = "AbortError";
	}
}, Ta = class extends Error {
	constructor() {
		super("load failed"), this.name = "FailedError";
	}
};
function Ea({ chat: e, corpora: t, upsertBatch: n, ports: r }) {
	let { lattice: i, cache: a, net: o, idleYield: s } = r, c = null, l = null, u = null, d = null, f = (e) => {
		if (e.aborted) throw new wa();
	};
	function p() {
		e.progress.loadedBytes = 0, e.progress.totalBytes = 0, e.progress.indexed = 0, e.progress.totalPoints = 0;
	}
	function m(t, n) {
		return e.status = "error", e.error = {
			kind: t,
			message: n?.message ? String(n.message) : String(n)
		}, new Ta();
	}
	async function h() {
		let e = u;
		u = null, e && await e.discard().catch(() => void 0);
	}
	function g() {
		if (e.status === "ready") return Promise.resolve();
		if (c) return c;
		let t = { aborted: !1 };
		return d = t, c = v(t).catch((n) => {
			t.aborted || n?.name === "AbortError" || n instanceof Ta || e.error || m("corpus", n);
		}).finally(() => {
			e.status !== "ready" && (c = null), d === t && (d = null), l = null, u = null;
		}), c;
	}
	function _() {
		if (e.status === "ready" || e.status === "idle") return;
		d && (d.aborted = !0), l?.abort();
		let t = u;
		u = null, t && t.discard().catch(() => void 0), c = null, e.error = null, e.offline = !1, p(), e.status = "idle";
	}
	async function v(n) {
		e.error = null, e.offline = !1, p(), e.status = "wasm-init";
		try {
			await i.init();
		} catch (e) {
			throw m("wasm", e);
		}
		f(n), e.status = "manifest";
		let r = [];
		for (let e of t) r.push(await y(n, e));
		let o;
		try {
			o = Ca(r.map((e) => ({
				id: e.corpus.id,
				meta: e.meta
			})));
		} catch (e) {
			throw m("config", e);
		}
		for (let e of r) e.file ||= await a.getCachedCorpus(e.corpus.id, e.meta.commitSha, e.meta.bytes), f(n);
		e.progress.totalBytes = r.reduce((e, t) => e + (t.file ? t.file.size : t.meta.gzBytes), 0), e.progress.totalPoints = r.reduce((e, t) => e + t.meta.points, 0);
		let s = [];
		for (let e of r) {
			let t = e.file ? await b(n, e) : await x(n, e);
			f(n), s.push({
				id: e.corpus.id,
				collection: e.corpus.id,
				commit: e.meta.commitSha,
				repo: e.meta.repo,
				files: e.meta.files,
				chunks: t.points ?? e.meta.points,
				dim: t.dim,
				generatedAt: e.meta.generatedAt
			});
		}
		e.corpora = s, e.embedding = o, e.status = "ready";
	}
	async function y(t, n) {
		let r;
		try {
			return r = await o.fetchMeta(n.metaUrl), {
				corpus: n,
				raw: r,
				meta: Sa(r, n.id),
				file: null
			};
		} catch (r) {
			f(t);
			let i = await a.newestOffline(n.id);
			if (f(t), !i) throw m("manifest", r);
			let o;
			try {
				o = Sa(i.rawMeta, n.id);
			} catch {
				throw m("manifest", r);
			}
			if (o.commitSha !== i.sha) throw m("manifest", r);
			return e.offline = !0, {
				corpus: n,
				raw: i.rawMeta,
				meta: o,
				file: i.file
			};
		}
	}
	async function b(t, n) {
		return e.status = "loading-cached", S(t, n.file.stream(), {
			collection: n.corpus.id,
			expectedDim: n.meta.dim,
			tee: null,
			countBytes: !0,
			onDrained: async () => {
				await a.writeMeta(n.corpus.id, n.meta.commitSha, n.raw), await a.pruneStale(n.corpus.id, n.meta.commitSha);
			}
		});
	}
	async function x(t, n) {
		let { id: r } = n.corpus, i = n.meta.commitSha;
		e.status = "downloading", l = new AbortController();
		let s;
		try {
			s = await o.openCorpus(n.corpus.gzUrl, l.signal);
		} catch (e) {
			throw f(t), e?.name === "AbortError" ? e : m("corpus", e);
		}
		s.contentLength !== null && (e.progress.totalBytes += s.contentLength - n.meta.gzBytes);
		let c = s.body.pipeThrough(new TransformStream({ transform(t, n) {
			e.progress.loadedBytes += t.byteLength, n.enqueue(t);
		} })), d = o.gunzip(c);
		if (d === null) throw m("decompress", /* @__PURE__ */ Error("this browser lacks DecompressionStream (gzip) support"));
		if (u = await a.createCorpusWriter(r, i), t.aborted) throw await h(), new wa();
		let p = async () => {
			e.status = "caching";
			let t = u;
			if (u = null, t) try {
				await t.finalize(), await a.writeMeta(r, i, n.raw);
			} catch {
				await t.discard().catch(() => void 0);
			}
			await a.pruneStale(r, i);
		};
		try {
			return await S(t, d, {
				collection: r,
				expectedDim: n.meta.dim,
				tee: u,
				countBytes: !1,
				onDrained: p
			});
		} catch (e) {
			throw await h(), t.aborted || e?.name === "AbortError" ? e : m(aa(e), e);
		}
	}
	async function S(t, r, { collection: a, expectedDim: o, tee: c, countBytes: l, onDrained: u }) {
		let d = r.getReader(), p = new TextDecoder(), m = null, h = [], g = async () => {
			h.length !== 0 && (i.upsert(a, h), e.progress.indexed += h.length, h = [], await s(), f(t));
		}, _ = va(async (e) => {
			if (!m) {
				m = ga(e, o), i.createCollection(a, m.dim);
				return;
			}
			let t = _a(e);
			t && h.push(t), h.length >= n && await g();
		});
		try {
			for (;;) {
				f(t);
				let { done: n, value: r } = await d.read();
				if (n) break;
				c && await c.write(r), l && (e.progress.loadedBytes += r.byteLength), await _.push(p.decode(r, { stream: !0 }));
			}
			await _.push(p.decode()), await _.end();
		} finally {
			d.releaseLock?.();
		}
		if (!m) throw Error("corpus stream ended before a header line");
		return f(t), await u(), f(t), e.status = "indexing", await g(), m;
	}
	return {
		ensureReady: g,
		abortLoad: _
	};
}
//#endregion
//#region src/state/session.svelte.js
function Da(e, t) {
	let { keys: n, clock: r } = t, i = e.provider.chatModel, a = Jt({
		status: "idle",
		progress: {
			loadedBytes: 0,
			totalBytes: 0,
			indexed: 0,
			totalPoints: 0
		},
		corpora: [],
		embedding: null,
		offline: !1,
		error: null,
		keyState: n.getKey() ? "set" : "missing",
		chatModel: n.getChatModel() || i,
		msgPhase: null,
		stream: null
	}), o = Ea({
		chat: a,
		corpora: e.corpora,
		upsertBatch: e.retrieval.upsertBatch,
		ports: t
	});
	function s(e) {
		let t = String(e ?? "").trim();
		t && (n.setChatModel(t), a.chatModel = t, a.error?.kind === "quota" && (a.error = null));
	}
	function c() {
		n.clearChatModel(), a.chatModel = i;
	}
	function l(e) {
		let t = String(e ?? "").trim();
		t && (n.setKey(t), a.keyState = "set", a.error?.kind === "key" && (a.error = null));
	}
	function u() {
		n.clearKey(), a.keyState = "missing";
	}
	function d(e, t, n = {}) {
		a.error = {
			kind: e,
			message: t?.message ? String(t.message) : String(t),
			...n
		};
	}
	async function f(i, o) {
		if (a.status !== "ready") throw Error("the corpus is not ready yet");
		let s = n.getKey();
		if (!s) {
			let e = /* @__PURE__ */ Error("no OpenRouter key set — add one to start asking");
			throw d("key", e), e;
		}
		a.stream = {
			reasoningText: "",
			answerText: "",
			reasoningMs: 0
		};
		let c = "", l = "", u = "", f = 0, p = 0, m = () => {
			f = 0, a.stream && (l &&= (a.stream.reasoningText += l, ""), u &&= (a.stream.answerText += u, ""));
		}, h = () => {
			f ||= r.requestFrame(m);
		}, g = ({ reasoning: e, content: t }) => {
			e && (p ||= r.now(), c += e, l += e, h()), t && (a.msgPhase !== "writing" && (a.msgPhase = "writing", p && a.stream && a.stream.reasoningMs === 0 && (a.stream.reasoningMs = r.now() - p)), u += t, h());
		};
		try {
			let n = await ha(i, o, {
				openrouter: t.openrouter,
				lattice: t.lattice,
				corpora: a.corpora,
				embedding: a.embedding,
				retrieval: e.retrieval,
				productName: e.brand.productName,
				rerankModel: e.provider.rerankModel,
				chatModel: a.chatModel,
				apiKey: s,
				onPhase: (e) => {
					a.msgPhase = e;
				},
				onDelta: g
			});
			[
				"rate",
				"quota",
				"key"
			].includes(a.error?.kind) && (a.error = null);
			let l = a.stream?.reasoningMs || (p ? r.now() - p : 0);
			return {
				...n,
				reasoning: c,
				reasoningMs: l
			};
		} catch (e) {
			let { kind: t, resetAt: n } = ia(e);
			throw d(t, e, t === "quota" ? { resetAt: n } : {}), e;
		} finally {
			f && r.cancelFrame(f), a.msgPhase = null, a.stream = null;
		}
	}
	return {
		chat: a,
		defaultChatModel: i,
		ensureReady: o.ensureReady,
		abortLoad: o.abortLoad,
		setKey: l,
		clearKey: u,
		setChatModel: s,
		resetChatModel: c,
		ask: f
	};
}
//#endregion
//#region node_modules/svelte/src/internal/disclose-version.js
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add("5");
//#endregion
//#region src/core/markdown.js
function Oa(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ka(e) {
	let t = e;
	return t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s*[\]]+)\)/g, "<a href=\"$2\" rel=\"noopener nofollow\" target=\"_blank\">$1</a>"), t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"), t = t.replace(/\[(\d{1,3})\](?!\()/g, "<sup class=\"cc-cite\">[$1]</sup>"), t;
}
function Aa(e) {
	return Oa(e).split(/(`[^`\n]+`)/).map((e) => e.length > 2 && e.startsWith("`") && e.endsWith("`") ? `<code>${e.slice(1, -1)}</code>` : ka(e)).join("");
}
function ja(e, t) {
	let n = t ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/, r = e.map((e) => `<li>${Aa(e.replace(n, ""))}</li>`).join("");
	return t ? `<ol>${r}</ol>` : `<ul>${r}</ul>`;
}
function Ma(e) {
	if (typeof e != "string" || e.length === 0) return "";
	let t = e.replace(/\r\n?/g, "\n").split("\n"), n = [], r = [], i = () => {
		if (r.length === 0) return;
		let e = r.every((e) => /^\s*[-*]\s+/.test(e)), t = r.every((e) => /^\s*\d+[.)]\s+/.test(e));
		e ? n.push(ja(r, !1)) : t ? n.push(ja(r, !0)) : n.push(`<p>${r.map(Aa).join("<br>")}</p>`), r = [];
	};
	for (let e = 0; e < t.length; e++) {
		let a = t[e], o = a.match(/^```([\w+-]*)\s*$/);
		if (o) {
			i();
			let r = o[1], a = [];
			for (e++; e < t.length && !/^```\s*$/.test(t[e]);) a.push(t[e]), e++;
			let s = r ? ` class="language-${r}"` : "";
			n.push(`<pre class="cc-fence"><code${s}>${Oa(a.join("\n"))}</code></pre>`);
		} else a.trim() === "" ? i() : r.push(a);
	}
	return i(), n.join("");
}
//#endregion
//#region src/ui/ChatMessage.svelte
var Na = /* @__PURE__ */ q("<p class=\"cm-user\"><span class=\"cm-prompt\" aria-hidden=\"true\">❯</span> </p>"), Pa = /* @__PURE__ */ q("<span class=\"cm-count\"> </span>"), Fa = /* @__PURE__ */ q("<button type=\"button\" class=\"cm-think-toggle\"><span class=\"cm-think-time\"> </span> <span class=\"cm-think-sep\" aria-hidden=\"true\">·</span> <span class=\"cm-think-act\"> </span></button>"), Ia = /* @__PURE__ */ q("<span class=\"cm-think-label\"> </span>"), La = /* @__PURE__ */ q("<div class=\"cm-think\"><!> <div class=\"cm-think-clip\"><p class=\"cm-think-text\"> </p></div></div>"), Ra = /* @__PURE__ */ q("<div class=\"cm-body\"></div>"), za = /* @__PURE__ */ q("<span class=\"cm-src-corpus\"> </span>"), Ba = /* @__PURE__ */ q("<a class=\"cm-src\" target=\"_blank\" rel=\"noopener\"><span class=\"cm-src-n\"> </span> <!> <span class=\"cm-src-path\"> </span> <span class=\"cm-src-lines\"> </span> <span class=\"cm-src-pct\"> </span></a>"), Va = /* @__PURE__ */ q("<details class=\"cm-sources\"><summary> </summary> <!></details>"), Ha = /* @__PURE__ */ q("<article class=\"cm-card cm-print\"><header class=\"cm-head\"><span class=\"cm-title\"> </span> <!></header> <!> <!> <!></article>");
function Ua(e, t) {
	Be(t, !0);
	let n = /* @__PURE__ */ j(() => t.live ? t.live.reasoningText : t.message?.reasoning ?? ""), r = /* @__PURE__ */ j(() => t.live ? t.live.answerText : t.message?.text ?? ""), i = /* @__PURE__ */ j(() => t.live ? t.live.reasoningMs : t.message?.reasoningMs ?? 0), a = /* @__PURE__ */ j(() => (G(i) / 1e3).toFixed(1)), o = /* @__PURE__ */ j(() => G(r).length > 0), s = /* @__PURE__ */ N(null), c = /* @__PURE__ */ j(() => G(s) ?? !G(o)), l = /* @__PURE__ */ N(null);
	fn(() => {
		G(n), t.live && G(l) && (G(l).scrollTop = G(l).scrollHeight);
	});
	var u = yr(), d = tn(u), f = (e) => {
		var n = Na(), r = R(L(n), 1, !0);
		O(n), z(() => Y(r, t.message.text)), J(e, n);
	}, p = (e) => {
		var i = Ha(), u = L(i), d = L(u), f = L(d, !0);
		O(d);
		var p = R(d, 2), m = (e) => {
			var n = Pa(), r = L(n);
			O(n), z(() => Y(r, `${t.message.sources.length ?? ""}
          ${(t.message.sources.length === 1 ? t.copy.sourcesOne : t.copy.sourcesMany) ?? ""}`)), J(e, n);
		};
		X(p, (e) => {
			t.message?.sources?.length && e(m);
		}), O(u);
		var h = R(u, 2), g = (e) => {
			var r = La(), i = L(r), u = (e) => {
				var n = Fa(), r = L(n), i = L(r);
				O(r);
				var o = R(r, 4), l = L(o, !0);
				O(o), O(n), z(() => {
					Z(n, "aria-expanded", G(c)), Y(i, `${t.copy.trace.reasonedPrefix ?? ""} ${G(a) ?? ""}s`), Y(l, G(c) ? t.copy.trace.hide : t.copy.trace.show);
				}), lr("click", n, () => P(s, !G(c))), J(e, n);
			}, d = (e) => {
				var n = Ia(), r = L(n, !0);
				O(n), z(() => Y(r, t.copy.trace.label)), J(e, n);
			};
			X(i, (e) => {
				G(o) ? e(u) : e(d, -1);
			});
			var f = R(i, 2), p = L(f), m = L(p, !0);
			O(p), ni(p, (e) => P(l, e), () => G(l)), O(f), O(r), z(() => {
				Z(r, "data-open", G(c)), Y(m, G(n));
			}), J(e, r);
		};
		X(h, (e) => {
			G(n) && e(g);
		});
		var _ = R(h, 2), v = (e) => {
			var t = Ra();
			Ir(t, () => Ma(G(r)), !0), O(t), J(e, t);
		};
		X(_, (e) => {
			(G(r) || !t.live) && e(v);
		});
		var y = R(_, 2), b = (e) => {
			var n = Va(), r = L(n), i = L(r, !0);
			O(r), Ar(R(r, 2), 17, () => t.message.sources, (e) => e.n, (e, n) => {
				var r = Ba(), i = L(r), a = L(i);
				O(i);
				var o = R(i, 2), s = (e) => {
					var t = za(), r = L(t, !0);
					O(t), z(() => Y(r, G(n).corpusId)), J(e, t);
				};
				X(o, (e) => {
					t.showCorpus && e(s);
				});
				var c = R(o, 2), l = L(c, !0);
				O(c);
				var u = R(c, 2), d = L(u);
				O(u);
				var f = R(u, 2), p = L(f);
				O(f), O(r), z((e) => {
					Z(r, "href", G(n).url), Y(a, `[${G(n).n ?? ""}]`), Y(l, G(n).path), Y(d, `L${G(n).startLine ?? ""}–${G(n).endLine ?? ""}`), Y(p, `${e ?? ""}%`);
				}, [() => Math.round(G(n).relevancePct)]), J(e, r);
			}), O(n), z(() => {
				n.open = t.sourcesOpen, Y(i, t.copy.sourcesHeading);
			}), J(e, n);
		};
		X(y, (e) => {
			t.message?.sources?.length && e(b);
		}), O(i), z(() => {
			Z(i, "data-streaming", t.live ? G(o) ? "writing" : "thinking" : void 0), Y(f, t.copy.answerTag);
		}), J(e, i);
	};
	X(d, (e) => {
		t.message?.role === "user" ? e(f) : e(p, -1);
	}), J(e, u), Ve();
}
ur(["click"]);
//#endregion
//#region src/ui/ErrorCard.svelte
var Wa = /* @__PURE__ */ q("<p class=\"cc-error-reset\"> </p>"), Ga = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-error-paid\"> </button>"), Ka = /* @__PURE__ */ q("<div class=\"cc-error\" role=\"alert\"><span class=\"cc-error-tag\"> </span> <p class=\"cc-error-body\"> </p> <!> <div class=\"cc-error-actions\"><!> <button type=\"button\" class=\"cc-error-retry\"> </button></div></div>");
function qa(e, t) {
	Be(t, !0);
	var n = Ka(), r = L(n), i = L(r, !0);
	O(r);
	var a = R(r, 2), o = L(a, !0);
	O(a);
	var s = R(a, 2), c = (e) => {
		var n = Wa(), r = L(n, !0);
		O(n), z(() => Y(r, t.resetText)), J(e, n);
	};
	X(s, (e) => {
		t.resetText && e(c);
	});
	var l = R(s, 2), u = L(l), d = (e) => {
		var n = Ga(), r = L(n, !0);
		O(n), z(() => Y(r, t.paidLabel)), lr("click", n, function(...e) {
			t.onpaid?.apply(this, e);
		}), J(e, n);
	};
	X(u, (e) => {
		t.paidLabel && e(d);
	});
	var f = R(u, 2), p = L(f, !0);
	O(f), O(l), O(n), z(() => {
		Y(i, t.entry.tag), Y(o, t.detail ?? t.entry.body), Y(p, t.entry.retry);
	}), lr("click", f, function(...e) {
		t.onretry?.apply(this, e);
	}), J(e, n), Ve();
}
ur(["click"]);
//#endregion
//#region src/ui/KeyRow.svelte
var Ja = /* @__PURE__ */ q("<div class=\"cc-key\"><span class=\"cc-key-tag\"> </span> <p class=\"cc-key-lead\"> <a class=\"cc-link\" target=\"_blank\" rel=\"noopener\"> </a></p> <form class=\"cc-key-form\"><input class=\"cc-key-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"button\" class=\"cc-key-toggle\"> </button> <button type=\"submit\" class=\"cc-key-save\"> </button></form></div>"), Ya = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-model-reset\"> </button>"), Xa = /* @__PURE__ */ q("<div class=\"cc-keyrow\"><span class=\"cc-connected\"><span class=\"cc-connected-dot\" aria-hidden=\"true\"></span> </span> <span class=\"cc-keyrow-note\"> </span> <button type=\"button\" class=\"cc-keyrow-swap\"> </button> <span class=\"cc-model\"><span class=\"cc-model-label\"> </span> <span class=\"cc-model-id\"> </span> <!></span></div>");
function Za(e, t) {
	Be(t, !0);
	let n = /* @__PURE__ */ j(() => t.session.chat), r = /* @__PURE__ */ N(""), i = /* @__PURE__ */ N(!1), a = /* @__PURE__ */ j(() => G(n).chatModel === t.session.defaultChatModel);
	function o(e) {
		e.preventDefault();
		let n = G(r).trim();
		n && (t.session.setKey(n), P(r, ""), P(i, !1), t.onsaved());
	}
	var s = yr(), c = tn(s), l = (e) => {
		var n = Ja(), a = L(n), s = L(a, !0);
		O(a);
		var c = R(a, 2), l = L(c), u = R(l), d = L(u, !0);
		O(u), O(c);
		var f = R(c, 2), p = L(f);
		Jr(p);
		var m = R(p, 2), h = L(m, !0);
		O(m);
		var g = R(m, 2), _ = L(g, !0);
		O(g), O(f), O(n), z((e) => {
			Y(s, t.copy.key.tag), Y(l, `${t.copy.key.lead ?? ""} `), Z(u, "href", t.copy.key.url), Y(d, t.copy.key.linkText), Z(p, "type", G(i) ? "text" : "password"), Z(p, "placeholder", t.copy.key.placeholder), Z(p, "aria-label", t.copy.key.inputLabel), Z(m, "aria-pressed", G(i)), Y(h, G(i) ? t.copy.key.conceal : t.copy.key.reveal), g.disabled = e, Y(_, t.copy.key.save);
		}, [() => !G(r).trim()]), cr("submit", f, o), Qr(p, () => G(r), (e) => P(r, e)), lr("click", m, () => P(i, !G(i))), J(e, n);
	}, u = (e) => {
		var r = Xa(), i = L(r), o = R(L(i), 1, !0);
		O(i);
		var s = R(i, 2), c = L(s, !0);
		O(s);
		var l = R(s, 2), u = L(l, !0);
		O(l);
		var d = R(l, 2), f = L(d), p = L(f, !0);
		O(f);
		var m = R(f, 2), h = L(m, !0);
		O(m);
		var g = R(m, 2), _ = (e) => {
			var n = Ya(), r = L(n, !0);
			O(n), z(() => Y(r, t.copy.model.reset)), lr("click", n, () => t.session.resetChatModel()), J(e, n);
		};
		X(g, (e) => {
			G(a) || e(_);
		}), O(d), O(r), z(() => {
			Y(o, t.copy.key.connectedTag), Y(c, t.copy.key.connectedNote), Y(u, t.copy.key.change), Z(d, "title", G(n).chatModel), Y(p, t.copy.model.label), Y(h, G(n).chatModel);
		}), lr("click", l, () => {
			t.session.clearKey(), t.onswapped();
		}), J(e, r);
	};
	X(c, (e) => {
		G(n).keyState === "missing" ? e(l) : e(u, -1);
	}), J(e, s), Ve();
}
ur(["click"]);
//#endregion
//#region src/ui/LatticeIcon.svelte
var Qa = /* @__PURE__ */ _r("<svg class=\"cc-icon\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.5 7.5 12 4M4.5 7.5 12 12M4.5 7.5 12 20M4.5 16.5 12 4M4.5 16.5 12 12M4.5 16.5 12 20M12 4 19.5 7.5M12 12 19.5 7.5M12 20 19.5 7.5M12 4 19.5 16.5M12 12 19.5 16.5M12 20 19.5 16.5\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\"0.6\"></path><g fill=\"currentColor\"><circle cx=\"4.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"4.5\" cy=\"16.5\" r=\"2\"></circle><circle cx=\"12\" cy=\"4\" r=\"2\"></circle><circle cx=\"12\" cy=\"12\" r=\"2\"></circle><circle cx=\"12\" cy=\"20\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"16.5\" r=\"2\"></circle></g></svg>");
function $a(e, t) {
	var n = Qa();
	z(() => {
		Z(n, "width", t.size), Z(n, "height", t.size);
	}), J(e, n);
}
//#endregion
//#region src/core/template.js
function eo(e, t) {
	return e.replace(/\{(\w+)\}/g, (n, r) => {
		if (!Object.hasOwn(t, r)) throw Error(`copy template ${JSON.stringify(e)} names {${r}} but no value was given`);
		return String(t[r]);
	});
}
//#endregion
//#region src/core/status.js
var to = Object.freeze([
	"wasm-init",
	"manifest",
	"loading-cached",
	"downloading",
	"caching",
	"indexing"
]), no = [
	"wasm-init",
	"manifest",
	"corpus",
	"indexing"
], ro = (e) => (e / 1048576).toFixed(1), io = (e) => String(e).slice(0, 7);
function ao(e, t) {
	return eo(e.progress.bytes, {
		loaded: ro(t.loadedBytes),
		total: ro(t.totalBytes)
	});
}
function oo(e, t) {
	return eo(e.progress.count, {
		done: t.indexed,
		total: t.totalPoints
	});
}
function so(e, t, n) {
	if (n) return t.phase[e.msgPhase] ?? t.phase.writing;
	if (e.status === "ready" && e.corpora.length > 0) {
		let n = e.corpora.reduce((e, t) => e + t.chunks, 0), r = e.corpora.length === 1 ? io(e.corpora[0].commit) : eo(t.pill.corpora, { n: e.corpora.length }), i = [
			t.status.ready,
			r,
			eo(t.pill.chunks, { n }),
			eo(t.pill.dim, { n: e.corpora[0].dim })
		];
		return e.offline && i.push(t.offlineBadge), i.join(" · ");
	}
	return e.status === "downloading" && e.progress.totalBytes > 0 ? `${t.status.downloading} ${ao(t, e.progress)}` : e.status === "indexing" && e.progress.totalPoints > 0 ? `${t.status.indexing} ${oo(t, e.progress)}` : t.status[e.status] ?? e.status;
}
function co(e, t) {
	return e.status === "error" ? "error" : e.status === "ready" ? t ? "working" : "ready" : e.status === "idle" ? "idle" : "working";
}
function lo(e, t) {
	let n = e.progress;
	return e.status === "downloading" || e.status === "caching" ? n.totalBytes > 0 ? ao(t, n) : "" : (e.status === "indexing" || e.status === "loading-cached") && n.totalPoints > 0 ? oo(t, n) : "";
}
function uo(e, t) {
	let n = [
		"loading-cached",
		"downloading",
		"caching"
	].includes(e.status) ? "corpus" : e.status, r = no.indexOf(n);
	return no.map((n, i) => ({
		id: n,
		label: t.loader.stages[n],
		state: r === -1 ? "pending" : i < r ? "done" : i === r ? "active" : "pending",
		detail: i === r ? lo(e, t) : ""
	}));
}
function fo(e) {
	let t = e.progress;
	return (e.status === "downloading" || e.status === "caching") && t.totalBytes > 0 ? Math.min(100, t.loadedBytes / t.totalBytes * 100) : (e.status === "indexing" || e.status === "loading-cached") && t.totalPoints > 0 ? Math.min(100, t.indexed / t.totalPoints * 100) : null;
}
//#endregion
//#region src/ui/LoaderPanel.svelte
var po = /* @__PURE__ */ q("<div><dt> </dt> <dd> </dd></div>"), mo = /* @__PURE__ */ q("<dl class=\"cc-load-meta\"><div><dt> </dt> <dd> </dd></div> <!></dl>"), ho = /* @__PURE__ */ q("<span class=\"cc-stage-detail\"> </span>"), go = /* @__PURE__ */ q("<li class=\"cc-stage\"><span class=\"cc-stage-glyph\" aria-hidden=\"true\"> </span> <span class=\"cc-stage-label\"> </span> <!></li>"), _o = /* @__PURE__ */ q("<p class=\"cc-offline\"> </p>"), vo = /* @__PURE__ */ q("<div class=\"cc-panel cc-load\" aria-busy=\"true\"><p class=\"cc-load-title\"> </p> <!> <ol class=\"cc-stages\"></ol> <div class=\"cc-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\"><div></div></div> <!> <p class=\"cc-fine\"> </p></div>");
function yo(e, t) {
	Be(t, !0);
	let n = /* @__PURE__ */ j(() => uo(t.chat, t.copy)), r = /* @__PURE__ */ j(() => fo(t.chat));
	var i = vo(), a = L(i), o = L(a, !0);
	O(a);
	var s = R(a, 2), c = (e) => {
		var n = mo(), r = L(n), i = L(r), a = L(i, !0);
		O(i);
		var o = R(i, 2), s = L(o, !0);
		O(o), O(r);
		var c = R(r, 2), l = (e) => {
			var n = po(), r = L(n), i = L(r, !0);
			O(r);
			var a = R(r, 2), o = L(a, !0);
			O(a), O(n), z(() => {
				Y(i, t.copy.loader.chunksLabel), Y(o, t.chat.progress.totalPoints);
			}), J(e, n);
		};
		X(c, (e) => {
			t.chat.progress.totalPoints > 0 && e(l);
		}), O(n), z((e) => {
			Y(a, t.copy.loader.sizeLabel), Y(s, e);
		}, [() => eo(t.copy.progress.size, { total: ro(t.chat.progress.totalBytes) })]), J(e, n);
	};
	X(s, (e) => {
		t.chat.progress.totalBytes > 0 && e(c);
	});
	var l = R(s, 2);
	Ar(l, 21, () => G(n), (e) => e.id, (e, t) => {
		var n = go(), r = L(n), i = L(r, !0);
		O(r);
		var a = R(r, 2), o = L(a, !0);
		O(a);
		var s = R(a, 2), c = (e) => {
			var n = ho(), r = L(n, !0);
			O(n), z(() => Y(r, G(t).detail)), J(e, n);
		};
		X(s, (e) => {
			G(t).detail && e(c);
		}), O(n), z(() => {
			Z(n, "data-state", G(t).state), Y(i, G(t).state === "done" ? "✓" : G(t).state === "active" ? "●" : "○"), Y(o, G(t).label);
		}), J(e, n);
	}), O(l);
	var u = R(l, 2), d = L(u);
	let f, p;
	O(u);
	var m = R(u, 2), h = (e) => {
		var n = _o(), r = L(n, !0);
		O(n), z(() => Y(r, t.copy.offlineBadge)), J(e, n);
	};
	X(m, (e) => {
		t.chat.offline && e(h);
	});
	var g = R(m, 2), _ = L(g, !0);
	O(g), O(i), z((e) => {
		Y(o, t.copy.loader.title), Z(u, "aria-label", t.copy.loader.title), Z(u, "aria-valuenow", e), f = Hr(d, 1, "cc-bar-fill", null, f, { "cc-shimmer": G(r) === null }), p = Wr(d, "", p, { width: `${(G(r) === null ? 100 : G(r)) ?? ""}%` }), Y(_, t.copy.loader.cancelNote);
	}, [() => G(r) === null ? void 0 : Math.round(G(r))]), J(e, i), Ve();
}
//#endregion
//#region src/ui/RepoChat.svelte
var bo = /* @__PURE__ */ q("<div class=\"cc-motif\" aria-hidden=\"true\"></div>"), xo = /* @__PURE__ */ q("<div class=\"cc-panel\"><!></div>"), So = /* @__PURE__ */ q("<p class=\"cc-offline\"> </p>"), Co = /* @__PURE__ */ q("<p class=\"cc-boot-line\"> </p>"), wo = /* @__PURE__ */ q("<p class=\"cc-boot-line cc-boot-corpus\"> </p>"), To = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-chip\"> </button>"), Eo = /* @__PURE__ */ q("<p class=\"cc-sub\"> </p> <div class=\"cc-boot\"><!> <!></div> <div class=\"cc-chips\"></div>", 1), Do = /* @__PURE__ */ q("<p class=\"cc-pending\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-pending-bar cc-shimmer\" aria-hidden=\"true\"></span></p>"), Oo = /* @__PURE__ */ q("<div class=\"cc-log\" role=\"log\" aria-live=\"polite\"><!> <!> <!> <!> <!></div>"), ko = /* @__PURE__ */ q("<div class=\"cc-backdrop\" role=\"presentation\"><div class=\"cc\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\"><!> <header class=\"cc-head\"><div class=\"cc-head-titles\"><span class=\"cc-slabel\"><!> </span> <h2 class=\"cc-title\"> </h2></div> <p class=\"cc-status\" aria-live=\"polite\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-status-text\"> </span></p> <button type=\"button\" class=\"cc-close\">✕</button></header> <!> <!> <form class=\"cc-input-row\"><span class=\"cc-prompt\" aria-hidden=\"true\">❯</span> <input class=\"cc-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"submit\" class=\"cc-ask\"> </button></form> <div class=\"cc-foot\"><span class=\"cc-hint\" aria-live=\"polite\"><!></span> <span class=\"cc-fineprint\"> </span></div></div></div>");
function Ao(e, t) {
	Be(t, !0);
	let n = /* @__PURE__ */ j(() => t.session.chat), r = /* @__PURE__ */ N(null), i = /* @__PURE__ */ N(null), a = /* @__PURE__ */ N(null), o = /* @__PURE__ */ N(""), s = Jt([]), c = /* @__PURE__ */ N(0), l = /* @__PURE__ */ N(!1), u = /* @__PURE__ */ N(null), d = "", f = /* @__PURE__ */ j(() => to.includes(G(n).status) || G(n).status === "idle"), p = /* @__PURE__ */ j(() => G(n).status === "ready"), m = /* @__PURE__ */ j(() => G(n).status === "error" ? G(n).error : null), h = /* @__PURE__ */ j(() => G(p) && G(n).keyState === "set" && !G(l)), g = /* @__PURE__ */ j(() => so(G(n), t.copy, G(l))), _ = /* @__PURE__ */ j(() => co(G(n), G(l))), v = /* @__PURE__ */ j(() => G(u)?.resetAt ? new Date(G(u).resetAt).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit"
	}) : ""), y = /* @__PURE__ */ j(() => G(n).chatModel.endsWith(":free") ? G(n).chatModel.slice(0, -5) : ""), b = /* @__PURE__ */ j(() => G(l) && G(n).stream && (G(n).stream.reasoningText || G(n).stream.answerText) ? G(n).stream : null), x = /* @__PURE__ */ j(() => G(b) ? [...s, {
		id: G(c),
		role: "assistant",
		live: G(b)
	}] : s), S = /* @__PURE__ */ j(() => G(m) ? t.copy.errors[G(m).kind] ?? t.copy.errors.generic : null);
	fn(() => {
		let e = document.activeElement;
		return document.body.style.overflow = "hidden", G(r)?.focus(), t.session.ensureReady(), () => {
			document.body.style.overflow = "", e instanceof HTMLElement && e.focus();
		};
	}), fn(() => {
		G(n).status === "ready" && t.onready();
	}), fn(() => {
		s.length, G(l), G(n).msgPhase, G(n).stream?.reasoningText, G(n).stream?.answerText, G(a) && (!G(b) && !G(l) && !t.reducedMotion() ? G(a).scrollTo({
			top: G(a).scrollHeight,
			behavior: "smooth"
		}) : G(a).scrollTop = G(a).scrollHeight);
	});
	function ee() {
		to.includes(G(n).status) && t.session.abortLoad(), t.onclose();
	}
	function te(e) {
		if (e.key !== "Tab" || !G(r)) return;
		let t = [...G(r).querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])")].filter((e) => e.offsetParent !== null);
		if (t.length === 0) return;
		let n = t[0], i = t[t.length - 1];
		e.shiftKey && (document.activeElement === n || document.activeElement === G(r)) ? (e.preventDefault(), i.focus()) : !e.shiftKey && document.activeElement === i && (e.preventDefault(), n.focus());
	}
	async function C(e, r) {
		P(l, !0), P(u, null);
		try {
			let n = await t.session.ask(e, r);
			s.push({
				id: Gt(c),
				role: "assistant",
				text: n.answer,
				sources: n.sources,
				reasoning: n.reasoning,
				reasoningMs: n.reasoningMs
			});
		} catch {
			let e = G(n).error?.kind;
			P(u, {
				kind: [
					"rate",
					"quota",
					"key"
				].includes(e) ? e : "generic",
				resetAt: e === "quota" ? G(n).error?.resetAt ?? null : null,
				detail: e === "corpus" ? G(n).error?.message : null
			}, !0);
		} finally {
			P(l, !1);
		}
	}
	function ne(e) {
		let t = (typeof e == "string" ? e : G(o)).trim();
		if (!t || !G(h)) return;
		P(o, ""), d = t;
		let n = s.map((e) => ({
			role: e.role,
			content: e.text
		}));
		s.push({
			id: Gt(c),
			role: "user",
			text: t
		}), C(t, n);
	}
	function re() {
		d && !G(l) && (G(u)?.kind === "key" ? (t.session.clearKey(), P(u, null)) : C(d, s.slice(0, -1).map((e) => ({
			role: e.role,
			content: e.text
		}))));
	}
	function ie() {
		G(y) && (t.session.setChatModel(G(y)), P(u, null), re());
	}
	function ae(e) {
		G(h) ? ne(e) : P(o, e, !0);
	}
	var oe = ko();
	cr("keydown", Yt, (e) => {
		e.key === "Escape" && ee();
	});
	var se = L(oe), ce = L(se), le = (e) => {
		var n = bo();
		Ir(n, () => t.brand.motifSvg, !0), O(n), J(e, n);
	};
	X(ce, (e) => {
		t.brand.motifSvg && e(le);
	});
	var ue = R(ce, 2), de = L(ue), fe = L(de), pe = L(fe);
	$a(pe, { size: 14 });
	var me = R(pe, 1, !0);
	O(fe);
	var he = R(fe, 2), ge = L(he, !0);
	O(he), O(de);
	var _e = R(de, 2), ve = R(L(_e), 2), ye = L(ve, !0);
	O(ve), O(_e);
	var be = R(_e, 2);
	O(ue);
	var xe = R(ue, 2), Se = (e) => {
		var n = xo(), r = L(n);
		{
			let e = /* @__PURE__ */ j(() => G(m).kind === "config" ? G(m).message : null);
			qa(r, {
				get entry() {
					return G(S);
				},
				get detail() {
					return G(e);
				},
				resetText: "",
				paidLabel: "",
				onpaid: () => {},
				onretry: () => t.session.ensureReady()
			});
		}
		O(n), J(e, n);
	}, Ce = (e) => {
		yo(e, {
			get chat() {
				return G(n);
			},
			get copy() {
				return t.copy;
			}
		});
	}, we = (e) => {
		var r = Oo(), i = L(r), o = (e) => {
			var n = So(), r = L(n, !0);
			O(n), z(() => Y(r, t.copy.offlineBadge)), J(e, n);
		};
		X(i, (e) => {
			G(n).offline && e(o);
		});
		var c = R(i, 2), d = (e) => {
			var r = Eo(), i = tn(r), a = L(i, !0);
			O(i);
			var o = R(i, 2), s = L(o);
			Ar(s, 17, () => t.copy.boot, Er, (e, t) => {
				var n = Co(), r = L(n, !0);
				O(n), z(() => Y(r, G(t))), J(e, n);
			}), Ar(R(s, 2), 17, () => G(n).corpora, (e) => e.id, (e, n) => {
				var r = wo(), i = L(r, !0);
				O(r), z((e) => Y(i, e), [() => eo(t.copy.corpusLine, {
					id: G(n).id,
					chunks: G(n).chunks,
					files: G(n).files,
					commit: io(G(n).commit)
				})]), J(e, r);
			}), O(o);
			var c = R(o, 2);
			Ar(c, 21, () => t.copy.starters, Er, (e, t) => {
				var n = To(), r = L(n, !0);
				O(n), z(() => Y(r, G(t))), lr("click", n, () => ae(G(t))), J(e, n);
			}), O(c), z(() => Y(a, t.copy.sub)), J(e, r);
		};
		X(c, (e) => {
			s.length === 0 && e(d);
		});
		var f = R(c, 2);
		Ar(f, 17, () => G(x), (e) => e.id, (e, r) => {
			{
				let i = /* @__PURE__ */ j(() => G(r).live ? null : G(r)), a = /* @__PURE__ */ j(() => G(r).live ?? null), o = /* @__PURE__ */ j(() => G(n).corpora.length > 1);
				Ua(e, {
					get message() {
						return G(i);
					},
					get live() {
						return G(a);
					},
					get sourcesOpen() {
						return t.sourcesOpen;
					},
					get copy() {
						return t.copy;
					},
					get showCorpus() {
						return G(o);
					}
				});
			}
		});
		var p = R(f, 2), m = (e) => {
			var r = Do(), i = R(L(r));
			Ne(), O(r), z(() => Y(i, ` ${t.copy.phase[G(n).msgPhase] ?? t.copy.phase.writing ?? ""} `)), J(e, r);
		};
		X(p, (e) => {
			!G(b) && G(l) && e(m);
		});
		var h = R(p, 2), g = (e) => {
			{
				let n = /* @__PURE__ */ j(() => G(u).kind === "quota" && G(v) ? `${t.copy.errors.quota.reset} ${G(v)}.` : ""), r = /* @__PURE__ */ j(() => G(u).kind === "quota" && G(y) ? t.copy.errors.quota.paid : "");
				qa(e, {
					get entry() {
						return t.copy.errors[G(u).kind];
					},
					get detail() {
						return G(u).detail;
					},
					get resetText() {
						return G(n);
					},
					get paidLabel() {
						return G(r);
					},
					onpaid: ie,
					onretry: re
				});
			}
		};
		X(h, (e) => {
			G(u) && e(g);
		}), O(r), ni(r, (e) => P(a, e), () => G(a)), J(e, r);
	};
	X(xe, (e) => {
		G(m) ? e(Se) : G(f) ? e(Ce, 1) : e(we, -1);
	});
	var w = R(xe, 2);
	Za(w, {
		get session() {
			return t.session;
		},
		get copy() {
			return t.copy;
		},
		onsaved: () => G(i)?.focus(),
		onswapped: () => P(u, null)
	});
	var Te = R(w, 2), Ee = R(L(Te), 2);
	Jr(Ee), ni(Ee, (e) => P(i, e), () => G(i));
	var De = R(Ee, 2), Oe = L(De, !0);
	O(De), O(Te);
	var ke = R(Te, 2), Ae = L(ke), T = L(Ae), je = (e) => {
		var n = vr();
		z(() => Y(n, t.copy.input.hintLoading)), J(e, n);
	}, E = (e) => {
		var n = vr();
		z(() => Y(n, t.copy.input.hintNoKey)), J(e, n);
	};
	X(T, (e) => {
		!G(p) && !G(m) ? e(je) : G(n).keyState === "missing" && e(E, 1);
	}), O(Ae);
	var D = R(Ae, 2), Me = L(D, !0);
	O(D), O(ke), O(se), ni(se, (e) => P(r, e), () => G(r)), O(oe), z((e) => {
		Z(se, "aria-label", t.copy.navLabel), Y(me, t.copy.label), Y(ge, t.copy.title), Z(_e, "data-tone", G(_)), Z(_e, "title", G(g)), Y(ye, G(g)), Z(be, "aria-label", t.copy.closeLabel), Z(Ee, "placeholder", t.copy.input.placeholder), Z(Ee, "aria-label", t.copy.navLabel), Ee.disabled = !G(p), De.disabled = e, Y(Oe, t.copy.input.ask), Y(Me, t.copy.input.fine);
	}, [() => !G(h) || !G(o).trim()]), lr("click", oe, ee), lr("click", se, (e) => e.stopPropagation()), lr("keydown", se, te), lr("click", be, ee), cr("submit", Te, (e) => {
		e.preventDefault(), ne();
	}), Qr(Ee, () => G(o), (e) => P(o, e)), J(e, oe), Ve();
}
ur(["click", "keydown"]);
//#endregion
//#region src/index.js
var jo = "(max-width: 860px)", Mo = /* @__PURE__ */ new Map();
function No(e) {
	return JSON.stringify([
		e.corpora,
		e.wasm,
		e.provider,
		e.retrieval,
		e.storage.keyPrefix,
		e.brand.productName
	]);
}
function Po(e) {
	let t = No(e), n = Mo.get(t);
	if (!n) {
		let r = {
			fetch: Mi,
			sleep: ki
		};
		n = Da(e, {
			openrouter: Xi(e.provider, r),
			lattice: Vi(e.wasm, {
				importModule: Ni,
				fetch: Mi
			}),
			cache: na(e.storage.keyPrefix, { getDirectory: Pi() }),
			net: zi({ fetch: Mi }),
			keys: ra(e.storage.keyPrefix, window.localStorage),
			clock: Ai,
			idleYield: Oi
		}), Mo.set(t, n);
	}
	return n;
}
function Fo(e) {
	if (typeof window > "u" || typeof document > "u") throw Error(`${e} runs in a browser only`);
}
function Io(e) {
	let t = Di(e);
	Fo("warmRepoChat"), Fi(t.assets.cssHref).catch(() => {}), Ri(t.wasm.binUrl, `${t.storage.keyPrefix}lattice-wasm`);
}
function Lo(e) {
	let t = Di(e);
	Fo("openRepoChat");
	let n = document.createElement("div");
	n.className = "arr-root";
	for (let [e, r] of si(t.theme)) n.style.setProperty(e, r);
	let r, i = new Promise((e, t) => {
		r = {
			resolve: e,
			reject: t
		};
	});
	i.catch(() => {});
	let a = null, o = !1, s = !1;
	function c() {
		s || (s = !0, l.abortLoad(), a && wr(a), n.remove(), o || r.reject(/* @__PURE__ */ Error("the chat was closed before its corpora were ready")), t.onClose?.());
	}
	let l = Po(t);
	return t.mount.appendChild(n), Fi(t.assets.cssHref).catch((e) => {
		console.error(e);
	}).then(() => {
		s || (a = br(Ao, {
			target: n,
			props: {
				session: l,
				copy: t.copy,
				brand: t.brand,
				sourcesOpen: !ji(jo),
				reducedMotion: () => ji("(prefers-reduced-motion: reduce)"),
				onclose: c,
				onready: () => {
					o || (o = !0, r.resolve(), t.onReady?.());
				}
			}
		}));
	}), {
		close: c,
		ready: i
	};
}
//#endregion
export { ii as COPY_EN, ci as ConfigError, Lo as openRepoChat, Io as warmRepoChat };
