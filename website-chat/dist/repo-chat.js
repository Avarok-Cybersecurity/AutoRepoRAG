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
var m = 1024, h = 2048, g = 4096, _ = 8192, v = 16384, y = 32768, b = 1 << 25, x = 65536, S = 1 << 19, ee = 1 << 20, te = 1 << 25, C = 65536, w = 1 << 21, ne = 1 << 22, re = 1 << 23, ie = Symbol("$state"), ae = Symbol("legacy props"), oe = Symbol(""), se = Symbol("attributes"), ce = Symbol("class"), le = Symbol("style"), ue = Symbol("text"), de = Symbol("form reset"), fe = new class extends Error {
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
function be(e) {
	throw Error("https://svelte.dev/e/props_invalid_value");
}
function xe() {
	throw Error("https://svelte.dev/e/state_descriptors_fixed");
}
function Se() {
	throw Error("https://svelte.dev/e/state_prototype_fixed");
}
function Ce() {
	throw Error("https://svelte.dev/e/state_unsafe_mutation");
}
function we() {
	throw Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
//#endregion
//#region node_modules/svelte/src/constants.js
var Te = {}, T = Symbol("uninitialized"), Ee = "http://www.w3.org/1999/xhtml", De = "http://www.w3.org/2000/svg", Oe = "http://www.w3.org/1998/Math/MathML";
function ke() {
	console.warn("https://svelte.dev/e/derived_inert");
}
function Ae(e) {
	console.warn("https://svelte.dev/e/hydration_mismatch");
}
function je() {
	console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/hydration.js
var E = !1;
function Me(e) {
	E = e;
}
var D;
function O(e) {
	if (e === null) throw Ae(), Te;
	return D = e;
}
function Ne() {
	return O(/* @__PURE__ */ nn(D));
}
function k(e) {
	if (E) {
		if (/* @__PURE__ */ nn(D) !== null) throw Ae(), Te;
		D = e;
	}
}
function Pe(e = 1) {
	if (E) {
		for (var t = e, n = D; t--;) n = /* @__PURE__ */ nn(n);
		D = n;
	}
}
function Fe(e = !0) {
	for (var t = 0, n = D;;) {
		if (n.nodeType === 8) {
			var r = n.data;
			if (r === "]") {
				if (t === 0) return n;
				--t;
			} else (r === "[" || r === "[!" || r[0] === "[" && !isNaN(Number(r.slice(1)))) && (t += 1);
		}
		var i = /* @__PURE__ */ nn(n);
		e && n.remove(), n = i;
	}
}
function Ie(e) {
	if (!e || e.nodeType !== 8) throw Ae(), Te;
	return e.data;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/equality.js
function Le(e) {
	return e === this.v;
}
function Re(e, t) {
	return e == e ? e !== t || typeof e == "object" && !!e || typeof e == "function" : t == t;
}
function ze(e) {
	return !Re(e, this.v);
}
//#endregion
//#region node_modules/svelte/src/internal/client/context.js
var A = null;
function Be(e) {
	A = e;
}
function Ve(e, t = !1, n) {
	A = {
		p: A,
		i: !1,
		c: null,
		e: null,
		s: e,
		x: null,
		r: U,
		l: null
	};
}
function He(e) {
	var t = A, n = t.e;
	if (n !== null) {
		t.e = null;
		for (var r of n) hn(r);
	}
	return e !== void 0 && (t.x = e), t.i = !0, A = t.p, e ?? {};
}
function Ue() {
	return !0;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/task.js
var We = [];
function Ge() {
	var e = We;
	We = [], f(e);
}
function Ke(e) {
	if (We.length === 0 && !Dt) {
		var t = We;
		queueMicrotask(() => {
			t === We && Ge();
		});
	}
	We.push(e);
}
function qe() {
	for (; We.length > 0;) Ge();
}
function Je(e) {
	var t = U;
	if (t === null) return H.f |= re, e;
	if (!(t.f & 32768) && !(t.f & 4)) throw e;
	Ye(e, t);
}
function Ye(e, t) {
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
var Xe = ~(h | g | m);
function j(e, t) {
	e.f = e.f & Xe | t;
}
function Ze(e) {
	e.f & 512 || e.deps === null ? j(e, m) : j(e, g);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/utils.js
function Qe(e) {
	if (e !== null) for (let t of e) t.f & 2 && t.f & 65536 && (t.f ^= C, Qe(t.deps));
}
function $e(e, t, n) {
	e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), Qe(e.deps), j(e, m);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/store.js
var et = !1;
function tt(e) {
	var t = et;
	try {
		return et = !1, [e(), et];
	} finally {
		et = t;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/misc.js
var nt = !1;
function rt() {
	nt || (nt = !0, document.addEventListener("reset", (e) => {
		Promise.resolve().then(() => {
			if (!e.defaultPrevented) for (let t of e.target.elements) t[de]?.();
		});
	}, { capture: !0 }));
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function it(e) {
	var t = H, n = U;
	Ln(null), Rn(null);
	try {
		return e();
	} finally {
		Ln(t), Rn(n);
	}
}
function at(e, t, n, r = n) {
	e.addEventListener(t, () => it(n));
	let i = e[de];
	e[de] = i ? () => {
		i(), r(!0);
	} : () => r(!0), rt();
}
//#endregion
//#region node_modules/svelte/src/reactivity/create-subscriber.js
function ot(e) {
	let t = 0, n = Wt(0), r;
	return () => {
		fn() && (G(n), yn(() => (t === 0 && (r = ir(() => e(() => Jt(n)))), t += 1, () => {
			Ke(() => {
				--t, t === 0 && (r?.(), r = void 0, Jt(n));
			});
		})));
	};
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var st = x | S;
function ct(e, t, n, r) {
	new lt(e, t, n, r);
}
var lt = class {
	parent;
	is_pending = !1;
	transform_error;
	#e;
	#t = E ? D : null;
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
	#h = ot(() => (this.#m = Wt(this.#l), () => {
		this.#m = null;
	}));
	constructor(e, t, n, r) {
		this.#e = e, this.#n = t, this.#r = (e) => {
			var t = U;
			t.b = this, t.f |= 128, n(e);
		}, this.parent = U.b, this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e), this.#i = bn(() => {
			if (E) {
				let e = this.#t;
				Ne();
				let t = e.data === "[!";
				if (e.data.startsWith("[?")) {
					let t = JSON.parse(e.data.slice(2));
					this.#_(t);
				} else t ? this.#y() : this.#g();
			} else this.#b();
		}, st), E && (this.#e = D);
	}
	#g() {
		try {
			this.#a = xn(() => this.#r(this.#e));
		} catch (e) {
			this.error(e);
		}
	}
	#_(e) {
		let t = this.#n.failed, { reset: n, invoke_onerror: r } = this.#v(e);
		Ke(r), t && (this.#s = xn(() => {
			t(this.#e, () => e, () => n);
		}));
	}
	#v(e) {
		var t = !1, n = !1;
		let r = () => {
			t ? je() : (t = !0, n && we(), this.#s !== null && Dn(this.#s, () => {
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
					Ye(e, this.#i && this.#i.parent);
				}
			}
		};
	}
	#y() {
		let e = this.#n.pending;
		e && (this.is_pending = !0, this.#o = xn(() => e(this.#e)), Ke(() => {
			var e = this.#c = document.createDocumentFragment(), t = I();
			e.append(t), this.#a = this.#S(() => xn(() => this.#r(t))), this.#u === 0 && (this.#e.before(e), this.#c = null, Dn(this.#o, () => {
				this.#o = null;
			}), this.#x(N));
		}));
	}
	#b() {
		try {
			if (this.is_pending = this.has_pending_snippet(), this.#u = 0, this.#l = 0, this.#a = xn(() => {
				this.#r(this.#e);
			}), this.#u > 0) {
				var e = this.#c = document.createDocumentFragment();
				jn(this.#a, e);
				let t = this.#n.pending;
				this.#o = xn(() => t(this.#e));
			} else this.#x(N);
		} catch (e) {
			this.error(e);
		}
	}
	#x(e) {
		this.is_pending = !1, e.transfer_effects(this.#f, this.#p);
	}
	defer_effect(e) {
		$e(e, this.#f, this.#p);
	}
	is_rendered() {
		return !this.is_pending && (!this.parent || this.parent.is_rendered());
	}
	has_pending_snippet() {
		return !!this.#n.pending;
	}
	#S(e) {
		var t = U, n = H, r = A;
		Rn(this.#i), Ln(this.#i), Be(this.#i.ctx);
		try {
			return Nt.ensure(), e();
		} catch (e) {
			return Je(e), null;
		} finally {
			Rn(t), Ln(n), Be(r);
		}
	}
	#C(e, t) {
		this.has_pending_snippet() ? (this.#u += e, this.#u === 0 && (this.#x(t), this.#o && Dn(this.#o, () => {
			this.#o = null;
		}), this.#c &&= (this.#e.before(this.#c), null))) : this.parent && this.parent.#C(e, t);
	}
	update_pending_count(e, t) {
		this.#C(e, t), this.#l += e, !(!this.#m || this.#d) && (this.#d = !0, Ke(() => {
			this.#d = !1, this.#m && Kt(this.#m, this.#l);
		}));
	}
	get_effect_pending() {
		return this.#h(), G(this.#m);
	}
	error(e) {
		if (!this.#n.onerror && !this.#n.failed) throw e;
		N?.is_fork ? (this.#a && N.skip_effect(this.#a), this.#o && N.skip_effect(this.#o), this.#s && N.skip_effect(this.#s), N.oncommit(() => {
			this.#w(e);
		})) : this.#w(e);
	}
	#w(e) {
		this.#a &&= (V(this.#a), null), this.#o &&= (V(this.#o), null), this.#s &&= (V(this.#s), null), E && (O(this.#t), Pe(), O(Fe()));
		let t = this.#n.failed, n = (e) => {
			let { reset: n, invoke_onerror: r } = this.#v(e);
			r(), t && (this.#s = this.#S(() => {
				try {
					return xn(() => {
						var r = U;
						r.b = this, r.f |= 128, t(this.#e, () => e, () => n);
					});
				} catch (e) {
					return Ye(e, this.#i.parent), null;
				}
			}));
		};
		Ke(() => {
			var t;
			try {
				t = this.transform_error(e);
			} catch (e) {
				Ye(e, this.#i && this.#i.parent);
				return;
			}
			typeof t == "object" && t && typeof t.then == "function" ? t.then(n, (e) => Ye(e, this.#i && this.#i.parent)) : n(t);
		});
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/async.js
function ut(e, t, n, r) {
	let i = Ue() ? mt : _t;
	var a = e.filter((e) => !e.settled), o = t.map(i);
	if (n.length === 0 && a.length === 0) {
		r(o);
		return;
	}
	var s = U, c = dt(), l = a.length === 1 ? a[0].promise : a.length > 1 ? Promise.all(a.map((e) => e.promise)) : null;
	function u(e) {
		if (!(s.f & 16384)) {
			c();
			try {
				r([...o, ...e]);
			} catch (e) {
				Ye(e, s);
			}
			ft();
		}
	}
	var d = pt();
	if (n.length === 0) {
		l.then(() => u([])).finally(d);
		return;
	}
	function f() {
		Promise.all(n.map((e) => /* @__PURE__ */ gt(e))).then(u).catch((e) => Ye(e, s)).finally(d);
	}
	l ? l.then(() => {
		c(), f(), ft();
	}) : f();
}
function dt() {
	var e = U, t = H, n = A, r = N;
	return function(i = !0) {
		Rn(e), Ln(t), Be(n), i && !(e.f & 16384) && (r?.activate(), r?.apply());
	};
}
function ft(e = !0) {
	Rn(null), Ln(null), Be(null), e && N?.deactivate();
}
function pt() {
	var e = U, t = e.b, n = N, r = !!t?.is_rendered();
	return t?.update_pending_count(1, n), n.increment(r, e), () => {
		t?.update_pending_count(-1, n), n.decrement(r, e);
	};
}
/*#__NO_SIDE_EFFECTS__*/
function mt(e) {
	var t = 2 | h;
	return U !== null && (U.f |= S), {
		ctx: A,
		deps: null,
		effects: null,
		equals: Le,
		f: t,
		fn: e,
		reactions: null,
		rv: 0,
		v: T,
		wv: 0,
		parent: U,
		ac: null
	};
}
var ht = Symbol("obsolete");
/*#__NO_SIDE_EFFECTS__*/
function gt(e, t, n) {
	let r = U;
	r === null && me();
	var i = void 0, a = Wt(T), o = !H, s = /* @__PURE__ */ new Set();
	return vn(() => {
		var t = U, n = p();
		i = n.promise;
		try {
			Promise.resolve(e()).then(n.resolve, (e) => {
				e !== fe && n.reject(e);
			}).finally(ft);
		} catch (e) {
			n.reject(e), ft();
		}
		var c = N;
		if (o) {
			if (t.f & 32768) var l = pt();
			if (r.b?.is_rendered()) c.async_deriveds.get(t)?.reject(ht);
			else for (let e of s.values()) e.reject(ht);
			s.add(n), c.async_deriveds.set(t, n);
		}
		let u = (e, t = void 0) => {
			l?.(), s.delete(n), t !== ht && (c.activate(), t ? (a.f |= re, Kt(a, t)) : (a.f & 8388608 && (a.f ^= re), Kt(a, e)), c.deactivate());
		};
		n.promise.then(u, (e) => u(null, e || "unknown"));
	}), pn(() => {
		for (let e of s) e.reject(ht);
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
function M(e) {
	let t = /* @__PURE__ */ mt(e);
	return Bn(t), t;
}
/*#__NO_SIDE_EFFECTS__*/
function _t(e) {
	let t = /* @__PURE__ */ mt(e);
	return t.equals = ze, t;
}
function vt(e) {
	var t = e.effects;
	if (t !== null) {
		e.effects = null;
		for (var n = 0; n < t.length; n += 1) V(t[n]);
	}
}
function yt(e) {
	var t, n = U, r = e.parent;
	if (!Pn && r !== null && e.v !== T && r.f & 24576) return ke(), e.v;
	Rn(r);
	try {
		e.f &= ~C, vt(e), t = Zn(e);
	} finally {
		Rn(n);
	}
	return t;
}
function bt(e) {
	var t = yt(e);
	!e.equals(t) && (e.wv = Jn(), (!N?.is_fork || e.deps === null) && (N === null ? e.v = t : (N.capture(e, t, !0), wt?.capture(e, t, !0)), e.deps === null)) ? j(e, m) : Pn || (Tt === null ? Ze(e) : (fn() || N?.is_fork) && Tt.set(e, t));
}
function xt(e) {
	if (e.effects !== null) for (let t of e.effects) (t.teardown || t.ac) && (t.teardown?.(), t.ac !== null && it(() => {
		t.ac.abort(fe), t.ac = null;
	}), t.fn !== null && (t.teardown = d), $n(t, 0), Cn(t));
}
function St(e) {
	if (e.effects !== null) for (let t of e.effects) t.teardown && t.fn !== null && er(t);
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/batch.js
var Ct = null, N = null, wt = null, Tt = null, Et = null, Dt = !1, Ot = !1, kt = null, At = null, jt = 0, Mt = 1, Nt = class e {
	id = Mt++;
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
		Ct === null ? Ct = this : (Ct.#n = this, this.#t = Ct), Ct = this;
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
			for (var r of n.d) j(r, h), t(r);
			for (r of n.m) j(r, g), t(r);
		}
		this.#p.add(e);
	}
	#g() {
		this.#e = !0, jt++ > 1e3 && (this.#x(), Ft());
		for (let e of this.#u) this.#d.delete(e), j(e, h), this.schedule(e);
		for (let e of this.#d) j(e, g), this.schedule(e);
		let t = this.#c;
		this.#c = [], this.apply();
		var n = kt = [], r = [], i = At = [];
		for (let e of t) try {
			this.#_(e, n, r);
		} catch (t) {
			throw Bt(e), this.#h() || this.discard(), t;
		}
		if (N = null, i.length > 0) {
			var a = e.ensure();
			for (let e of i) a.schedule(e);
		}
		if (kt = null, At = null, this.#h()) {
			this.#b(r), this.#b(n);
			for (let [e, t] of this.#f) zt(e, t);
			i.length > 0 && N.#g();
			return;
		}
		let o = this.#v();
		if (o) this.#b(r), this.#b(n), o.#y(this);
		else {
			this.#u.clear(), this.#d.clear();
			for (let e of this.#r) e(this);
			this.#r.clear(), wt = this, Lt(r), Lt(n), wt = null, this.#s?.resolve();
			var s = N;
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
				a ? r.f ^= m : i & 4 ? t.push(r) : Yn(r) && (i & 16 && this.#d.add(r), er(r));
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
					r & 4194320 && !this.async_deriveds.has(i) && (this.#d.delete(i), j(i, h), this.schedule(i));
				}
			}
		};
		for (let e of this.current.keys()) t(e);
		this.oncommit(() => e.discard()), e.#x(), N = this, this.#g();
	}
	#b(e) {
		for (var t = 0; t < e.length; t += 1) $e(e[t], this.#u, this.#d);
	}
	capture(e, t, n = !1) {
		e.v !== T && !this.previous.has(e) && this.previous.set(e, e.v), e.f & 8388608 || (this.current.set(e, [t, n]), Tt?.set(e, t)), this.is_fork || (e.v = t);
	}
	activate() {
		N = this;
	}
	deactivate() {
		N = null, Tt = null;
	}
	flush() {
		try {
			Ot = !0, N = this, this.#g();
		} finally {
			jt = 0, Et = null, kt = null, At = null, Ot = !1, N = null, Tt = null, Ht.clear();
		}
	}
	discard() {
		for (let e of this.#i) e(this);
		this.#i.clear();
		for (let e of this.async_deriveds.values()) e.reject(ht);
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
		this.#m || (this.#m = !0, Ke(() => {
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
		if (N === null) {
			let t = N = new e();
			!Ot && !Dt && Ke(() => {
				t.#e || t.flush();
			});
		}
		return N;
	}
	apply() {
		Tt = null;
	}
	schedule(e) {
		if (Et = e, e.b?.is_pending && e.f & 16777228 && !(e.f & 32768)) e.b.defer_effect(e);
		else {
			for (var t = e; t.parent !== null;) {
				t = t.parent;
				var n = t.f;
				if (kt !== null && t === U && (H === null || !(H.f & 2))) return;
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
			e === null || (e.#n = t), t === null ? Ct = e : t.#t = e, this.linked = !1;
		}
	}
};
function Pt(e) {
	var t = Dt;
	Dt = !0;
	try {
		var n;
		for (e && (N !== null && !N.is_fork && N.flush(), n = e());;) {
			if (qe(), N === null) return n;
			N.flush();
		}
	} finally {
		Dt = t;
	}
}
function Ft() {
	try {
		ye();
	} catch (e) {
		Ye(e, Et);
	}
}
var It = null;
function Lt(e) {
	var t = e.length;
	if (t !== 0) {
		for (var n = 0; n < t;) {
			var r = e[n++];
			if (!(r.f & 24576) && Yn(r) && (It = /* @__PURE__ */ new Set(), er(r), r.deps === null && r.first === null && r.nodes === null && r.teardown === null && r.ac === null && En(r), It?.size > 0)) {
				Ht.clear();
				for (let e of It) {
					if (e.f & 24576) continue;
					let t = [e], n = e.parent;
					for (; n !== null;) It.has(n) && (It.delete(n), t.push(n)), n = n.parent;
					for (let e = t.length - 1; e >= 0; e--) {
						let n = t[e];
						n.f & 24576 || er(n);
					}
				}
				It.clear();
			}
		}
		It = null;
	}
}
function Rt(e) {
	N.schedule(e);
}
function zt(e, t) {
	if (!(e.f & 32 && e.f & 1024)) {
		e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), j(e, m);
		for (var n = e.first; n !== null;) zt(n, t), n = n.next;
	}
}
function Bt(e) {
	j(e, m);
	for (var t = e.first; t !== null;) Bt(t), t = t.next;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/sources.js
var Vt = /* @__PURE__ */ new Set(), Ht = /* @__PURE__ */ new Map(), Ut = !1;
function Wt(e, t) {
	return {
		f: 0,
		v: e,
		reactions: null,
		equals: Le,
		rv: 0,
		wv: 0
	};
}
/*#__NO_SIDE_EFFECTS__*/
function P(e, t) {
	let n = Wt(e, t);
	return Bn(n), n;
}
/*#__NO_SIDE_EFFECTS__*/
function Gt(e, t = !1, n = !0) {
	let r = Wt(e);
	return t || (r.equals = ze), r;
}
function F(e, t, n = !1) {
	return H !== null && (!In || H.f & 131072) && Ue() && H.f & 4325394 && (zn === null || !zn.has(e)) && Ce(), Kt(e, n ? Xt(t) : t, At);
}
function Kt(e, t, n = null) {
	if (!e.equals(t)) {
		Ht.set(e, Pn ? t : e.v);
		var r = Nt.ensure();
		if (r.capture(e, t), e.f & 2) {
			let t = e;
			e.f & 2048 && yt(t), Tt === null && Ze(t);
		}
		e.wv = Jn(), Yt(e, h, n), Ue() && U !== null && U.f & 1024 && !(U.f & 96) && (Hn === null ? Un([e]) : Hn.push(e)), !r.is_fork && Vt.size > 0 && !Ut && qt();
	}
	return t;
}
function qt() {
	Ut = !1;
	for (let e of Vt) {
		e.f & 1024 && j(e, g);
		let t;
		try {
			t = Yn(e);
		} catch {
			t = !0;
		}
		t && er(e);
	}
	Vt.clear();
}
function Jt(e) {
	F(e, e.v + 1);
}
function Yt(e, t, n) {
	var r = e.reactions;
	if (r !== null) for (var i = Ue(), a = r.length, o = 0; o < a; o++) {
		var s = r[o], c = s.f;
		if (i || s !== U) {
			var l = (c & h) === 0;
			if (l && j(s, t), c & 131072) Vt.add(s);
			else if (c & 2) {
				var u = s;
				Tt?.delete(u), c & 65536 || (c & 512 && (U === null || !(U.f & 2097152)) && (s.f |= C), Yt(u, g, n));
			} else if (l) {
				var d = s;
				c & 16 && It !== null && It.add(d), n === null ? Rt(d) : n.push(d);
			}
		}
	}
}
function Xt(t) {
	if (typeof t != "object" || !t || ie in t) return t;
	let n = l(t);
	if (n !== s && n !== c) return t;
	var r = /* @__PURE__ */ new Map(), i = e(t), o = /* @__PURE__ */ P(0), u = null, d = Kn, f = (e) => {
		if (Kn === d) return e();
		var t = H, n = Kn;
		Ln(null), qn(d);
		var r = e();
		return Ln(t), qn(n), r;
	};
	return i && r.set("length", /* @__PURE__ */ P(t.length, u)), new Proxy(t, {
		defineProperty(e, t, n) {
			(!("value" in n) || n.configurable === !1 || n.enumerable === !1 || n.writable === !1) && xe();
			var i = r.get(t);
			return i === void 0 ? f(() => {
				var e = /* @__PURE__ */ P(n.value, u);
				return r.set(t, e), e;
			}) : F(i, n.value, !0), !0;
		},
		deleteProperty(e, t) {
			var n = r.get(t);
			if (n === void 0) {
				if (t in e) {
					let e = f(() => /* @__PURE__ */ P(T, u));
					r.set(t, e), Jt(o);
				}
			} else F(n, T), Jt(o);
			return !0;
		},
		get(e, n, i) {
			if (n === ie) return t;
			var o = r.get(n), s = n in e;
			if (o === void 0 && (!s || a(e, n)?.writable) && (o = f(() => /* @__PURE__ */ P(Xt(s ? e[n] : T), u)), r.set(n, o)), o !== void 0) {
				var c = G(o);
				return c === T ? void 0 : c;
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
				if (a !== void 0 && o !== T) return {
					enumerable: !0,
					configurable: !0,
					value: o,
					writable: !0
				};
			}
			return n;
		},
		has(e, t) {
			if (t === ie) return !0;
			var n = r.get(t), i = n !== void 0 && n.v !== T || Reflect.has(e, t);
			return (n !== void 0 || U !== null && (!i || a(e, t)?.writable)) && (n === void 0 && (n = f(() => /* @__PURE__ */ P(i ? Xt(e[t]) : T, u)), r.set(t, n)), G(n) === T) ? !1 : i;
		},
		set(e, t, n, s) {
			var c = r.get(t), l = t in e;
			if (i && t === "length") for (var d = n; d < c.v; d += 1) {
				var p = r.get(d + "");
				p === void 0 ? d in e && (p = f(() => /* @__PURE__ */ P(T, u)), r.set(d + "", p)) : F(p, T);
			}
			if (c === void 0) (!l || a(e, t)?.writable) && (c = f(() => /* @__PURE__ */ P(void 0, u)), F(c, Xt(n)), r.set(t, c));
			else {
				l = c.v !== T;
				var m = f(() => Xt(n));
				F(c, m);
			}
			var h = Reflect.getOwnPropertyDescriptor(e, t);
			if (h?.set && h.set.call(s, n), !l) {
				if (i && typeof t == "string") {
					var g = r.get("length"), _ = Number(t);
					Number.isInteger(_) && _ >= g.v && F(g, _ + 1);
				}
				Jt(o);
			}
			return !0;
		},
		ownKeys(e) {
			G(o);
			var t = Reflect.ownKeys(e).filter((e) => {
				var t = r.get(e);
				return t === void 0 || t.v !== T;
			});
			for (var [n, i] of r) i.v !== T && !(n in e) && t.push(n);
			return t;
		},
		setPrototypeOf() {
			Se();
		}
	});
}
var Zt, Qt, $t, en;
function tn() {
	if (Zt === void 0) {
		Zt = window, Qt = /Firefox/.test(navigator.userAgent);
		var e = Element.prototype, t = Node.prototype, n = Text.prototype;
		$t = a(t, "firstChild").get, en = a(t, "nextSibling").get, u(e) && (e[ce] = void 0, e[se] = null, e[le] = void 0, e.__e = void 0), u(n) && (n[ue] = void 0);
	}
}
function I(e = "") {
	return document.createTextNode(e);
}
/*@__NO_SIDE_EFFECTS__*/
function L(e) {
	return $t.call(e);
}
/*@__NO_SIDE_EFFECTS__*/
function nn(e) {
	return en.call(e);
}
function R(e, t) {
	if (!E) return /* @__PURE__ */ L(e);
	var n = /* @__PURE__ */ L(D);
	if (n === null) n = D.appendChild(I());
	else if (t && n.nodeType !== 3) {
		var r = I();
		return n?.before(r), O(r), r;
	}
	return t && cn(n), O(n), n;
}
function rn(e, t = !1) {
	if (!E) {
		var n = /* @__PURE__ */ L(e);
		return n instanceof Comment && n.data === "" ? /* @__PURE__ */ nn(n) : n;
	}
	if (t) {
		if (D?.nodeType !== 3) {
			var r = I();
			return D?.before(r), O(r), r;
		}
		cn(D);
	}
	return D;
}
function z(e, t = 1, n = !1) {
	let r = E ? D : e;
	for (var i; t--;) i = r, r = /* @__PURE__ */ nn(r);
	if (!E) return r;
	if (n) {
		if (r?.nodeType !== 3) {
			var a = I();
			return r === null ? i?.after(a) : r.before(a), O(a), a;
		}
		cn(r);
	}
	return O(r), r;
}
function an(e) {
	e.textContent = "";
}
function on() {
	return !1;
}
function sn(e, t, n) {
	return t == null || t === "http://www.w3.org/1999/xhtml" ? n ? document.createElement(e, { is: n }) : document.createElement(e) : n ? document.createElementNS(t, e, { is: n }) : document.createElementNS(t, e);
}
function cn(e) {
	if (e.nodeValue.length < 65536) return;
	let t = e.nextSibling;
	for (; t !== null && t.nodeType === 3;) t.remove(), e.nodeValue += t.nodeValue, t = e.nextSibling;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/effects.js
function ln(e) {
	U === null && (H === null && ve(e), _e()), Pn && ge(e);
}
function un(e, t) {
	var n = t.last;
	n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function dn(e, t) {
	var n = U;
	n !== null && n.f & 8192 && (e |= _);
	var r = {
		ctx: A,
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
	N?.register_created_effect(r);
	var i = r;
	if (e & 4) kt === null ? Nt.ensure().schedule(r) : kt.push(r);
	else if (t !== null) {
		try {
			er(r);
		} catch (e) {
			throw V(r), e;
		}
		i.deps === null && i.teardown === null && i.nodes === null && i.first === i.last && !(i.f & 524288) && (i = i.first, e & 16 && e & 65536 && i !== null && (i.f |= x));
	}
	if (i !== null && (i.parent = n, n !== null && un(i, n), H !== null && H.f & 2 && !(e & 64))) {
		var a = H;
		(a.effects ??= []).push(i);
	}
	return r;
}
function fn() {
	return H !== null && !In;
}
function pn(e) {
	let t = dn(8, null);
	return j(t, m), t.teardown = e, t;
}
function mn(e) {
	ln("$effect");
	var t = U.f;
	if (!H && t & 32 && A !== null && !A.i) {
		var n = A;
		(n.e ??= []).push(e);
	} else return hn(e);
}
function hn(e) {
	return dn(4 | ee, e);
}
function gn(e) {
	Nt.ensure();
	let t = dn(64 | S, e);
	return (e = {}) => new Promise((n) => {
		e.outro ? Dn(t, () => {
			V(t), n(void 0);
		}) : (V(t), n(void 0));
	});
}
function _n(e) {
	return dn(4, e);
}
function vn(e) {
	return dn(ne | S, e);
}
function yn(e, t = 0) {
	return dn(8 | t, e);
}
function B(e, t = [], n = [], r = []) {
	ut(r, t, n, (t) => {
		dn(8, () => {
			e(...t.map(G));
		});
	});
}
function bn(e, t = 0) {
	return dn(16 | t, e);
}
function xn(e) {
	return dn(32 | S, e);
}
function Sn(e) {
	var t = e.teardown;
	if (t !== null) {
		let e = Pn, n = H;
		Fn(!0), Ln(null);
		try {
			t.call(null);
		} finally {
			Fn(e), Ln(n);
		}
	}
}
function Cn(e, t = !1) {
	var n = e.first;
	for (e.first = e.last = null; n !== null;) {
		let e = n.ac;
		e !== null && it(() => {
			e.abort(fe);
		});
		var r = n.next;
		n.f & 64 ? n.parent = null : V(n, t), n = r;
	}
}
function wn(e) {
	for (var t = e.first; t !== null;) {
		var n = t.next;
		t.f & 32 || V(t), t = n;
	}
}
function V(e, t = !0) {
	var n = !1;
	(t || e.f & 262144) && e.nodes !== null && e.nodes.end !== null && (Tn(e.nodes.start, e.nodes.end), n = !0), e.f |= b, Cn(e, t && !n), $n(e, 0);
	var r = e.nodes && e.nodes.t;
	if (r !== null) for (let e of r) e.stop();
	Sn(e), e.f ^= b, e.f |= v;
	var i = e.parent;
	i !== null && i.first !== null && En(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes = e.ac = e.b = null;
}
function Tn(e, t) {
	for (; e !== null;) {
		var n = e === t ? null : /* @__PURE__ */ nn(e);
		e.remove(), e = n;
	}
}
function En(e) {
	var t = e.parent, n = e.prev, r = e.next;
	n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Dn(e, t, n = !0) {
	var r = [];
	On(e, r, !0);
	var i = () => {
		n && V(e), t && t();
	}, a = r.length;
	if (a > 0) {
		var o = () => --a || i();
		for (var s of r) s.out(o);
	} else i();
}
function On(e, t, n) {
	if (!(e.f & 8192)) {
		e.f ^= _;
		var r = e.nodes && e.nodes.t;
		if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
		for (var i = e.first; i !== null;) {
			var a = i.next;
			if (!(i.f & 64)) {
				var o = !!(i.f & 65536) || !!(i.f & 32) && !!(e.f & 16);
				On(i, t, o ? n : !1);
			}
			i = a;
		}
	}
}
function kn(e) {
	An(e, !0);
}
function An(e, t) {
	if (e.f & 8192) {
		e.f ^= _, e.f & 1024 || (j(e, h), Nt.ensure().schedule(e));
		for (var n = e.first; n !== null;) {
			var r = n.next, i = !!(n.f & 65536) || !!(n.f & 32);
			An(n, i ? t : !1), n = r;
		}
		var a = e.nodes && e.nodes.t;
		if (a !== null) for (let e of a) (e.is_global || t) && e.in();
	}
}
function jn(e, t) {
	if (e.nodes) for (var n = e.nodes.start, r = e.nodes.end; n !== null;) {
		var i = n === r ? null : /* @__PURE__ */ nn(n);
		t.append(n), n = i;
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/legacy.js
var Mn = null, Nn = !1, Pn = !1;
function Fn(e) {
	Pn = e;
}
var H = null, In = !1;
function Ln(e) {
	H = e;
}
var U = null;
function Rn(e) {
	U = e;
}
var zn = null;
function Bn(e) {
	H !== null && (zn ??= /* @__PURE__ */ new Set()).add(e);
}
var W = null, Vn = 0, Hn = null;
function Un(e) {
	Hn = e;
}
var Wn = 1, Gn = 0, Kn = Gn;
function qn(e) {
	Kn = e;
}
function Jn() {
	return ++Wn;
}
function Yn(e) {
	var t = e.f;
	if (t & 2048) return !0;
	if (t & 2 && (e.f &= ~C), t & 4096) {
		for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
			var a = n[i];
			if (Yn(a) && bt(a), a.wv > e.wv) return !0;
		}
		t & 512 && Tt === null && j(e, m);
	}
	return !1;
}
function Xn(e, t, n = !0) {
	var r = e.reactions;
	if (r !== null && !(zn !== null && zn.has(e))) for (var i = 0; i < r.length; i++) {
		var a = r[i];
		a.f & 2 ? Xn(a, t, !1) : t === a && (n ? j(a, h) : a.f & 1024 && j(a, g), Rt(a));
	}
}
function Zn(e) {
	var t = W, n = Vn, r = Hn, i = H, a = zn, o = A, s = In, c = Kn, l = e.f;
	W = null, Vn = 0, Hn = null, H = l & 96 ? null : e, zn = null, Be(e.ctx), In = !1, Kn = ++Gn, e.ac !== null && (it(() => {
		e.ac.abort(fe);
	}), e.ac = null);
	try {
		e.f |= w;
		var u = e.fn, d = u();
		e.f |= y;
		var f = e.deps, p = N?.is_fork;
		if (W !== null) {
			var m;
			if (p || $n(e, Vn), f !== null && Vn > 0) for (f.length = Vn + W.length, m = 0; m < W.length; m++) f[Vn + m] = W[m];
			else e.deps = f = W;
			if (fn() && e.f & 512) for (m = Vn; m < f.length; m++) (f[m].reactions ??= []).push(e);
		} else !p && f !== null && Vn < f.length && ($n(e, Vn), f.length = Vn);
		if (Ue() && Hn !== null && !In && f !== null && !(e.f & 6146)) for (m = 0; m < Hn.length; m++) Xn(Hn[m], e);
		if (i !== null && i !== e) {
			if (Gn++, i.deps !== null) for (let e = 0; e < n; e += 1) i.deps[e].rv = Gn;
			if (t !== null) for (let e of t) e.rv = Gn;
			Hn !== null && (r === null ? r = Hn : r.push(...Hn));
		}
		return e.f & 8388608 && (e.f ^= re), d;
	} catch (e) {
		return Je(e);
	} finally {
		e.f ^= w, W = t, Vn = n, Hn = r, H = i, zn = a, Be(o), In = s, Kn = c;
	}
}
function Qn(e, r) {
	let i = r.reactions;
	if (i !== null) {
		var a = t.call(i, e);
		if (a !== -1) {
			var o = i.length - 1;
			o === 0 ? i = r.reactions = null : (i[a] = i[o], i.pop());
		}
	}
	if (i === null && r.f & 2 && (W === null || !n.call(W, r))) {
		var s = r;
		s.f & 512 && (s.f ^= 512, s.f &= ~C), s.v !== T && Ze(s), s.ac !== null && it(() => {
			s.ac.abort(fe), s.ac = null, j(s, h);
		}), xt(s), $n(s, 0);
	}
}
function $n(e, t) {
	var n = e.deps;
	if (n !== null) for (var r = t; r < n.length; r++) Qn(e, n[r]);
}
function er(e) {
	var t = e.f;
	if (!(t & 16384)) {
		j(e, m);
		var n = U, r = Nn;
		U = e, Nn = !(t & 96);
		try {
			t & 16777232 ? wn(e) : Cn(e), Sn(e);
			var i = Zn(e);
			e.teardown = typeof i == "function" ? i : null, e.wv = Wn;
		} finally {
			Nn = r, U = n;
		}
	}
}
async function tr() {
	await Promise.resolve(), Pt();
}
function G(e) {
	var t = !!(e.f & 2);
	if (Mn?.add(e), H !== null && !In && !(U !== null && U.f & 16384) && (zn === null || !zn.has(e))) {
		var r = H.deps;
		if (H.f & 2097152) e.rv < Gn && (e.rv = Gn, W === null && r !== null && r[Vn] === e ? Vn++ : W === null ? W = [e] : W.push(e));
		else {
			H.deps ??= [], n.call(H.deps, e) || H.deps.push(e);
			var i = e.reactions;
			i === null ? e.reactions = [H] : n.call(i, H) || i.push(H);
		}
	}
	if (Pn && Ht.has(e)) return Ht.get(e);
	if (t) {
		var a = e;
		if (Pn) {
			var o = a.v;
			return (!(a.f & 1024) && a.reactions !== null || rr(a)) && (o = yt(a)), Ht.set(a, o), o;
		}
		var s = !(a.f & 512) && !In && H !== null && (Nn || !!(H.f & 512)), c = (a.f & y) === 0;
		Yn(a) && (s && (a.f |= 512), bt(a)), s && !c && (St(a), nr(a));
	}
	if (Tt?.has(e)) return Tt.get(e);
	if (e.f & 8388608) throw e.v;
	return e.v;
}
function nr(e) {
	if (e.f |= 512, e.deps !== null) for (let t of e.deps) (t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (St(t), nr(t));
}
function rr(e) {
	if (e.v === T) return !0;
	if (e.deps === null) return !1;
	for (let t of e.deps) if (Ht.has(t) || t.f & 2 && rr(t)) return !0;
	return !1;
}
function ir(e) {
	var t = In;
	try {
		return In = !0, e();
	} finally {
		In = t;
	}
}
[.../* @__PURE__ */ "allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback".split(".")];
var ar = ["touchstart", "touchmove"];
function or(e) {
	return ar.includes(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
var sr = Symbol("events"), cr = /* @__PURE__ */ new Set(), lr = /* @__PURE__ */ new Set();
function ur(e, t, n, r = {}) {
	function i(e) {
		if (r.capture || mr.call(t, e), !e.cancelBubble) return it(() => n?.call(this, e));
	}
	return e.startsWith("pointer") || e.startsWith("touch") || e === "wheel" ? Ke(() => {
		t.addEventListener(e, i, r);
	}) : t.addEventListener(e, i, r), i;
}
function dr(e, t, n, r, i) {
	var a = {
		capture: r,
		passive: i
	}, o = ur(e, t, n, a);
	(t === document.body || t === window || t === document || t instanceof HTMLMediaElement) && pn(() => {
		t.removeEventListener(e, o, a);
	});
}
function K(e, t, n) {
	(t[sr] ??= {})[e] = n;
}
function fr(e) {
	for (var t = 0; t < e.length; t++) cr.add(e[t]);
	for (var n of lr) n(e);
}
var pr = null;
function mr(e) {
	var t = this, n = t.ownerDocument, r = e.type, a = e.composedPath?.() || [], o = a[0] || e.target;
	pr = e;
	var s = 0, c = pr === e && e[sr];
	if (c) {
		var l = a.indexOf(c);
		if (l !== -1 && (t === document || t === window)) {
			e[sr] = t;
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
		var d = H, f = U;
		Ln(null), Rn(null);
		try {
			for (var p, m = []; o !== null && o !== t;) {
				try {
					var h = o[sr]?.[r];
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
			e[sr] = t, delete e.currentTarget, Ln(d), Rn(f);
		}
	}
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/reconciler.js
var hr = globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", { createHTML: (e) => e });
function gr(e) {
	return hr?.createHTML(e) ?? e;
}
function _r(e) {
	var t = sn("template");
	return t.innerHTML = gr(e.replaceAll("<!>", "<!---->")), t.content;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/template.js
function vr(e, t) {
	var n = U;
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
		if (E) return vr(D, null), D;
		i === void 0 && (i = _r(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ L(i)));
		var t = r || Qt ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ L(t), s = t.lastChild;
			vr(o, s);
		} else vr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function yr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (E) return vr(D, null), D;
		if (!o) {
			var e = /* @__PURE__ */ L(_r(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ L(e);) o.appendChild(/* @__PURE__ */ L(e));
			else o = /* @__PURE__ */ L(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ L(t), r = t.lastChild;
			vr(n, r);
		} else vr(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function br(e, t) {
	return /* @__PURE__ */ yr(e, t, "svg");
}
function xr(e = "") {
	if (!E) {
		var t = I(e + "");
		return vr(t, t), t;
	}
	var n = D;
	return n.nodeType === 3 ? cn(n) : (n.before(n = I()), O(n)), vr(n, n), n;
}
function Sr() {
	if (E) return vr(D, null), D;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = I();
	return e.append(t, n), vr(t, n), e;
}
function J(e, t) {
	if (E) {
		var n = U;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = D), Ne();
	} else e !== null && e.before(t);
}
function Cr() {
	if (E && D && D.nodeType === 8 && D.textContent?.startsWith("$")) {
		let e = D.textContent.substring(1);
		return Ne(), e;
	}
	return (window.__svelte ??= {}).uid ??= 1, `c${window.__svelte.uid++}`;
}
function Y(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ue] ??= e.nodeValue) && (e[ue] = n, e.nodeValue = `${n}`);
}
function wr(e, t) {
	return Er(e, t);
}
var Tr = /* @__PURE__ */ new Map();
function Er(e, { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	tn();
	var l = void 0, u = gn(() => {
		var s = n ?? t.appendChild(I());
		ct(s, { pending: () => {} }, (t) => {
			Ve({});
			var n = A;
			if (o && (n.c = o), a && (i.$$events = a), E && vr(t, null), l = e(t, i) || {}, E && (U.nodes.end = D, D === null || D.nodeType !== 8 || D.data !== "]")) throw Ae(), Te;
			He();
		}, c);
		var u = /* @__PURE__ */ new Set(), d = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!u.has(r)) {
					u.add(r);
					var i = or(r);
					for (let e of [t, document]) {
						var a = Tr.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), Tr.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, mr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return d(r(cr)), lr.add(d), () => {
			for (var e of u) for (let n of [t, document]) {
				var r = Tr.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, mr), r.delete(e), r.size === 0 && Tr.delete(n)) : r.set(e, i);
			}
			lr.delete(d), s !== n && s.parentNode?.removeChild(s);
		};
	});
	return Dr.set(l, u), l;
}
var Dr = /* @__PURE__ */ new WeakMap();
function Or(e, t) {
	let n = Dr.get(e);
	return n ? (Dr.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var kr = class {
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
			if (n) kn(n), this.#r.delete(t);
			else {
				var r = this.#n.get(t);
				r && (kn(r.effect), this.#t.set(t, r.effect), this.#n.delete(t), r.fragment.lastChild.remove(), this.anchor.before(r.fragment), n = r.effect);
			}
			for (let [t, n] of this.#e) {
				if (this.#e.delete(t), t === e) break;
				let r = this.#n.get(n);
				r && (V(r.effect), this.#n.delete(n));
			}
			for (let [e, r] of this.#t) {
				if (e === t || this.#r.has(e)) continue;
				let i = () => {
					if (Array.from(this.#e.values()).includes(e)) {
						var t = document.createDocumentFragment();
						jn(r, t), t.append(I()), this.#n.set(e, {
							effect: r,
							fragment: t
						});
					} else V(r);
					this.#r.delete(e), this.#t.delete(e);
				};
				this.#i || !n ? (this.#r.add(e), Dn(r, i, !1)) : i();
			}
		}
	};
	#o = (e) => {
		this.#e.delete(e);
		let t = Array.from(this.#e.values());
		for (let [e, n] of this.#n) t.includes(e) || (V(n.effect), this.#n.delete(e));
	};
	ensure(e, t) {
		var n = N, r = on();
		if (t && !this.#t.has(e) && !this.#n.has(e)) {
			if (r) {
				var i = document.createDocumentFragment(), a = I();
				i.append(a), this.#n.set(e, {
					effect: xn(() => t(a)),
					fragment: i
				});
			} else this.#t.set(e, xn(() => t(this.anchor)));
		}
		if (this.#e.set(n, e), r) {
			for (let [t, r] of this.#t) t === e ? n.unskip_effect(r) : n.skip_effect(r);
			for (let [t, r] of this.#n) t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
			n.oncommit(this.#a), n.ondiscard(this.#o);
		} else E && (this.anchor = D), this.#a(n);
	}
};
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/if.js
function X(e, t, n = !1) {
	var r;
	E && (r = D, Ne());
	var i = new kr(e), a = n ? x : 0;
	function o(e, t) {
		if (E) {
			var n = Ie(r);
			if (e !== parseInt(n.substring(1))) {
				var a = Fe();
				O(a), i.anchor = a, Me(!1), i.ensure(e, t), Me(!0);
				return;
			}
		}
		i.ensure(e, t);
	}
	bn(() => {
		var e = !1;
		t((t, n = 0) => {
			e = !0, o(n, t);
		}), e || o(-1, null);
	}, a);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/each.js
function Ar(e, t) {
	return t;
}
function jr(e, t, n) {
	for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
		let n = t[c];
		Dn(n, () => {
			if (o) {
				if (o.pending.delete(n), o.done.add(n), o.pending.size === 0) {
					var t = e.outrogroups;
					Mr(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null);
				}
			} else --s;
		}, !1);
	}
	if (s === 0) {
		var l = i.length === 0 && n !== null && e.pending.size === 0;
		if (l) {
			var u = n, d = u.parentNode;
			an(d), d.append(u), e.items.clear();
		}
		Mr(e, t, !l);
	} else o = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function Mr(e, t, n = !0) {
	var r;
	if (e.pending.size > 0) {
		r = /* @__PURE__ */ new Set();
		for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
	}
	for (var i = 0; i < t.length; i++) {
		var a = t[i];
		r?.has(a) ? (a.f |= te, jn(a, document.createDocumentFragment())) : V(t[i], n);
	}
}
var Nr;
function Pr(t, n, i, a, o, s = null) {
	var c = t, l = /* @__PURE__ */ new Map();
	if (n & 4) {
		var u = t;
		c = E ? O(/* @__PURE__ */ L(u)) : u.appendChild(I());
	}
	E && Ne();
	var d = null, f = /* @__PURE__ */ _t(() => {
		var t = i();
		return e(t) ? t : t == null ? [] : r(t);
	}), p, m = /* @__PURE__ */ new Map(), h = !0;
	function g(e) {
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Ir(v, p, c, n, a), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= te, Rr(d, null, c)) : kn(d) : Dn(d, () => {
			d = null;
		})));
	}
	function _(e) {
		v.pending.delete(e);
	}
	var v = {
		effect: bn(() => {
			p = G(f);
			var e = p.length;
			let t = !1;
			E && Ie(c) === "[!" != (e === 0) && (c = Fe(), O(c), Me(!1), t = !0);
			for (var r = /* @__PURE__ */ new Set(), u = N, v = on(), y = 0; y < e; y += 1) {
				E && D.nodeType === 8 && D.data === "]" && (c = D, t = !0, Me(!1));
				var b = p[y], x = a(b, y), S = h ? null : l.get(x);
				S ? (S.v && Kt(S.v, b), S.i && Kt(S.i, y), v && u.unskip_effect(S.e)) : (S = Lr(l, h ? c : Nr ??= I(), b, x, y, o, n, i), h || (S.e.f |= te), l.set(x, S)), r.add(x);
			}
			if (e === 0 && s && !d && (h ? d = xn(() => s(c)) : (d = xn(() => s(Nr ??= I())), d.f |= te)), e > r.size && he("", "", ""), E && e > 0 && O(Fe()), !h) {
				if (m.set(u, r), v) {
					for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
					u.oncommit(g), u.ondiscard(_);
				} else g(u);
			}
			t && Me(!0), G(f);
		}),
		flags: n,
		items: l,
		pending: m,
		outrogroups: null,
		fallback: d
	};
	h = !1, E && (c = D);
}
function Fr(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Ir(e, t, n, i, a) {
	var o = !!(i & 8), s = t.length, c = e.items, l = Fr(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (o) for (v = 0; v < s; v += 1) h = t[v], g = a(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = a(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (kn(_), o && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= te, _ === l) Rr(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), zr(e, d, _), zr(e, _, y), Rr(_, y, n), d = _, p = [], m = [], l = Fr(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], ee = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Rr(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					zr(e, S.prev, ee.next), zr(e, d, S), zr(e, ee, b), l = b, d = ee, --v, p = [], m = [];
				} else u.delete(_), Rr(_, l, n), zr(e, _.prev, _.next), zr(e, _, d === null ? e.effect.first : d.next), zr(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Fr(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Fr(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (Mr(e, r(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var C = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || C.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && C.push(l), l = Fr(l.next);
		var w = C.length;
		if (w > 0) {
			var ne = i & 4 && s === 0 ? n : null;
			if (o) {
				for (v = 0; v < w; v += 1) C[v].nodes?.a?.measure();
				for (v = 0; v < w; v += 1) C[v].nodes?.a?.fix();
			}
			jr(e, C, ne);
		}
	}
	o && Ke(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Lr(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Wt(n) : /* @__PURE__ */ Gt(n, !1, !1) : null, l = o & 2 ? Wt(i) : null;
	return {
		v: c,
		i: l,
		e: xn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Rr(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ nn(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function zr(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function Br(e, t, n = !1, r = !1, i = !1, a = !1) {
	var o = e, s = "";
	if (n) {
		var c = e;
		E && (o = O(/* @__PURE__ */ L(c)));
	}
	B(() => {
		var e = U;
		if (s === (s = t() ?? "")) E && Ne();
		else if (n && !E) e.nodes = null, c.innerHTML = s, s !== "" && vr(/* @__PURE__ */ L(c), c.lastChild);
		else if (e.nodes !== null && (Tn(e.nodes.start, e.nodes.end), e.nodes = null), s !== "") {
			if (E) {
				for (var a = D.data, l = Ne(), u = l; l !== null && (l.nodeType !== 8 || l.data !== "");) u = l, l = /* @__PURE__ */ nn(l);
				if (l === null) throw Ae(), Te;
				vr(D, u), o = O(l);
			} else {
				var d = sn(r ? "svg" : i ? "math" : "template", r ? De : i ? Oe : void 0);
				d.innerHTML = s;
				var f = r || i ? d : d.content;
				if (vr(/* @__PURE__ */ L(f), f.lastChild), r || i) for (; /* @__PURE__ */ L(f);) o.before(/* @__PURE__ */ L(f));
				else o.before(f);
			}
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
var Vr = [..." 	\n\r\f\xA0\v﻿"];
function Hr(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Vr.includes(r[o - 1])) && (s === r.length || Vr.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function Ur(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Wr(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Gr(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Wr)), i && c.push(...Object.keys(i).map(Wr));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Wr(e.substring(l, u).trim());
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
		return r && (n += Ur(r)), i && (n += Ur(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Kr(e, t, n, r, i, a) {
	var o = e[ce];
	if (E || o !== n || o === void 0) {
		var s = Hr(n, r, a);
		(!E || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[ce] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function qr(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function Jr(e, t, n, r) {
	var i = e[le];
	if (E || i !== t) {
		var a = Gr(t, r);
		(!E || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[le] = t;
	} else r && (Array.isArray(r) ? (qr(e, n?.[0], r[0]), qr(e, n?.[1], r[1], "important")) : qr(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var Yr = Symbol("is custom element"), Xr = Symbol("is html"), Zr = pe ? "link" : "LINK";
function Qr(e) {
	if (E) {
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
		e[de] = n, Ke(n), rt();
	}
}
function Z(e, t, n, r) {
	var i = $r(e);
	E && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === Zr) || i[t] !== (i[t] = n) && (t === "loading" && (e[oe] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && ti(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function $r(e) {
	return e[se] ??= {
		[Yr]: e.nodeName.includes("-"),
		[Xr]: e.namespaceURI === Ee
	};
}
var ei = /* @__PURE__ */ new Map();
function ti(e) {
	var t = e.getAttribute("is") || e.nodeName, n = ei.get(t);
	if (n) return n;
	ei.set(t, n = []);
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var s in r = o(i), r) r[s].set && s !== "innerHTML" && s !== "textContent" && s !== "innerText" && n.push(s);
		i = l(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function ni(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	at(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = ri(e) ? ii(a) : a, n(a), N !== null && r.add(N), await tr(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (E && e.defaultValue !== e.value || ir(t) == null && e.value) && (n(ri(e) ? ii(e.value) : e.value), N !== null && r.add(N)), yn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = N;
			if (r.has(i)) return;
		}
		ri(e) && n === ii(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function ri(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function ii(e) {
	return e === "" ? null : +e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function ai(e, t) {
	return e === t || e?.[ie] === t;
}
function oi(e = {}, t, n, r) {
	var i = A.r, a = U;
	return _n(() => {
		var o, s;
		return yn(() => {
			o = s, s = r?.() || [], ir(() => {
				ai(n(...s), e) || (t(e, ...s), o && ai(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && ai(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
function si(e, t, n, r) {
	var i = !0, o = !!(n & 8), s = !!(n & 16), c = r, l = !0, u = void 0, d = () => s && i ? (u ??= /* @__PURE__ */ mt(r), G(u)) : (l && (l = !1, c = s ? ir(r) : r), c);
	let f;
	if (o) {
		var p = ie in e || ae in e;
		f = a(e, t)?.set ?? (p && t in e ? (n) => e[t] = n : void 0);
	}
	var m, h = !1;
	o ? [m, h] = tt(() => e[t]) : m = e[t], m === void 0 && r !== void 0 && (m = d(), f && (i && be(t), f(m)));
	var g = i ? () => {
		var n = e[t];
		return n === void 0 ? d() : (l = !0, n);
	} : () => {
		var n = e[t];
		return n !== void 0 && (c = void 0), n === void 0 ? c : n;
	};
	if (i && !(n & 4)) return g;
	if (f) {
		var _ = e.$$legacy;
		return (function(e, t) {
			return arguments.length > 0 ? ((!i || !t || _ || h) && f(t ? g() : e), e) : g();
		});
	}
	var v = !1, y = (n & 1 ? mt : _t)(() => (v = !1, g()));
	o && G(y);
	var b = U;
	return (function(e, t) {
		if (arguments.length > 0) {
			let n = t ? G(y) : i && o ? Xt(e) : e;
			return F(y, n), v = !0, c !== void 0 && (c = n), e;
		}
		return Pn && v || b.f & 16384 ? y.v : G(y);
	});
}
//#endregion
//#region src/copy-en.js
function ci(e) {
	if (e && typeof e == "object") {
		for (let t of Object.values(e)) ci(t);
		Object.freeze(e);
	}
	return e;
}
var li = ci({
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
		change: "swap key",
		swapTag: "replace key",
		swapLead: "Paste the new key and connect it. The current key keeps working until you do.",
		keep: "keep current key",
		forget: "forget key",
		forgotten: "key removed from this browser",
		undo: "undo"
	},
	status: {
		idle: "standby",
		consent: "download needed",
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
	size: {
		kb: "{n} KB",
		mb: "{n} MB"
	},
	consent: {
		title: "download the search index?",
		lead: "The first visit downloads the index into this browser, once. Later visits read it from there and start instantly.",
		engine: "search engine",
		total: "{download} to download, about {stored} kept in this browser",
		accept: "download {size}",
		decline: "not now"
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
	conversation: {
		label: "conversation",
		clear: "new conversation",
		cleared: "conversation cleared",
		undo: "undo"
	},
	codeLabel: "code block",
	answerTag: "answer",
	sourcesHeading: "source receipts",
	sourcesOne: "source",
	sourcesMany: "sources",
	model: {
		label: "answer model",
		reset: "back to free"
	},
	search: {
		navLabel: "Search the site",
		closeLabel: "Close search",
		label: "// search",
		title: "Search the site.",
		sub: "The search index runs right here in your browser. Type a few words and press enter.",
		placeholder: "search the site",
		submit: "search",
		resultsLabel: "search results",
		count: "{n} results for “{query}”",
		countOne: "1 result for “{query}”",
		empty: "nothing matched “{query}”, try other words",
		searching: "searching",
		crumbsLabel: "section",
		hintLoading: "the search index is still loading, hang tight",
		fine: "results link to the pages they were indexed from",
		plan: {
			bm25: "keyword",
			hybrid: "hybrid",
			dense: "semantic"
		},
		error: {
			tag: "search failed",
			body: "That search did not go through. Try it again in a moment.",
			retry: "search again"
		}
	},
	errors: {
		wasm: {
			tag: "engine fault",
			body: "The wasm engine failed to start. Usually a one off, a retry brings it right up.",
			retry: "restart engine"
		},
		unavailable: {
			tag: "corpus unavailable",
			body: "Not a connection problem: the server answered, but the corpus is not published where this site expects it. The site needs a fix.",
			retry: "retry"
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
			resetIn: "{h} h {m} min from now",
			paid: "switch to the paid model and spend my own credits",
			retry: "ask again"
		},
		service: {
			tag: "service error",
			body: "OpenRouter or the model provider hit a server error on its side. Ask again in a moment; if it keeps happening, the provider is down for now.",
			retry: "ask again"
		},
		network: {
			tag: "no connection",
			body: "Could not reach OpenRouter. Check your connection, then ask again.",
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
}), ui = Object.freeze([
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
function di(e) {
	return `--arr-${e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`;
}
function fi(e) {
	return ui.map((t) => [di(t), e[t]]);
}
//#endregion
//#region src/config/validate.js
var pi = class extends Error {
	constructor(e) {
		super(`openRepoChat: invalid config (${e.length} problem${e.length === 1 ? "" : "s"}):\n${e.map((e) => `  - ${e}`).join("\n")}`), this.name = "ConfigError", this.problems = e;
	}
}, mi = /^[a-z0-9][a-z0-9_-]{0,63}$/, hi = /^[A-Za-z0-9._-]{1,64}$/, gi = /^https?:\/\/[^\s/]+/, _i = /\{(\w+)\}/g, vi = (e) => typeof e == "object" && !!e && !Array.isArray(e) && Object.getPrototypeOf(e) === Object.prototype, yi = (e) => typeof e == "string" && e.trim() !== "" ? null : "must be a non-empty string", bi = (e) => yi(e) ?? (gi.test(e) ? null : "must be an absolute http(s) URL"), xi = (e) => (t) => Number.isSafeInteger(t) && t >= e ? null : `must be an integer >= ${e}`, Si = (e) => typeof e == "string" && hi.test(e) ? null : "must be 1-64 characters of [A-Za-z0-9._-]", Ci = (e) => e === null || typeof e == "string" && /^\s*<svg[\s>]/.test(e) && /<\/svg>\s*$/.test(e) ? null : "must be null (no watermark) or a complete <svg>...</svg> string", wi = (e) => typeof e == "object" && e && e.nodeType === 1 && typeof e.appendChild == "function" ? null : "must be a DOM Element", Ti = (e) => typeof e == "function" ? null : "must be a function", Q = (e) => ({
	kind: "leaf",
	check: e
}), Ei = (e) => ({
	kind: "leaf",
	check: e,
	optional: !0
}), Di = (e) => ({
	kind: "object",
	fields: e
}), Oi = { kind: "skip" }, ki = Q((e) => typeof e == "string" && mi.test(e) ? null : "must match /^[a-z0-9][a-z0-9_-]{0,63}$/"), Ai = (e) => ({
	kind: "corpora",
	shape: `{ id, ${e}, metaUrl }`,
	entry: Di({
		id: ki,
		[e]: Q(yi),
		metaUrl: Q(yi)
	})
}), ji = {
	kind: "nullable",
	what: "null or { model, dim, embed }",
	spec: Di({
		model: Q(yi),
		dim: Q(xi(1)),
		embed: Q(Ti)
	})
}, Mi = ["answer", "search"], Ni = {
	mode: {
		kind: "leaf",
		check: (e) => Mi.includes(e) ? null : `must be one of ${Mi.map((e) => `'${e}'`).join(", ")}`,
		missing: `missing (one of ${Mi.map((e) => `'${e}'`).join(", ")})`
	},
	mount: Q(wi),
	assets: Di({ cssHref: Q(yi) }),
	wasm: Di({
		jsUrl: Q(yi),
		binUrl: Q(yi)
	}),
	storage: Di({ keyPrefix: Q(Si) }),
	copy: { kind: "copy" },
	theme: Di(Object.fromEntries(ui.map((e) => [e, Q(yi)]))),
	onReady: Ei(Ti),
	onClose: Ei(Ti)
}, Pi = {
	answer: Di({
		...Ni,
		corpora: Ai("gzUrl"),
		provider: Di({
			apiUrl: Q(bi),
			rerankModel: Q(yi),
			chatModel: Q(yi),
			appTitle: Q(yi),
			referer: Q(bi),
			maxAttempts: Q(xi(1)),
			retryBaseMs: Q(xi(0))
		}),
		retrieval: Di({
			topK: Q(xi(1)),
			rerankMultiplier: Q(xi(1)),
			upsertBatch: Q(xi(1))
		}),
		brand: Di({
			productName: Q(yi),
			motifSvg: Q(Ci)
		})
	}),
	search: Di({
		...Ni,
		corpora: Ai("snapshotUrl"),
		search: Di({
			topK: Q(xi(1)),
			snippetChars: Q(xi(40)),
			embedder: ji
		}),
		brand: Di({ motifSvg: Q(Ci) })
	})
}, Fi = Di({
	...Ni,
	corpora: Oi,
	provider: Oi,
	retrieval: Oi,
	search: Oi,
	brand: Oi
});
function Ii(e, t, n, r) {
	if (e.kind === "skip") return;
	if (e.kind === "leaf") {
		if (t === void 0) {
			e.optional || r.push(`${n}: ${e.missing ?? "missing"}`);
			return;
		}
		let i = e.check(t);
		i && r.push(`${n}: ${i}`);
		return;
	}
	if (e.kind === "corpora") return Li(e, t, n, r);
	if (e.kind === "copy") return zi(li, t, n, r);
	if (e.kind === "nullable") {
		t === void 0 ? r.push(`${n}: missing (${e.what})`) : t !== null && !vi(t) ? r.push(`${n}: must be ${e.what}`) : t !== null && Ii(e.spec, t, n, r);
		return;
	}
	t !== void 0 && !vi(t) && (r.push(`${n}: must be an object`), t = void 0);
	let i = t ?? {};
	for (let [t, a] of Object.entries(e.fields)) Ii(a, i[t], n ? `${n}.${t}` : t, r);
	for (let t of Object.keys(i)) t in e.fields || r.push(`${n ? `${n}.` : ""}${t}: unknown key`);
}
function Li(e, t, n, r) {
	if (t === void 0) {
		r.push(`${n}: missing (a non-empty array of ${e.shape})`);
		return;
	}
	if (!Array.isArray(t) || t.length === 0) {
		r.push(`${n}: must be a non-empty array of ${e.shape}`);
		return;
	}
	let i = /* @__PURE__ */ new Set();
	t.forEach((t, a) => {
		let o = `${n}[${a}]`;
		Ii(e.entry, t, o, r);
		let s = vi(t) ? t.id : void 0;
		typeof s == "string" && (i.has(s) && r.push(`${o}.id: duplicate corpus id ${JSON.stringify(s)}`), i.add(s));
	});
}
function Ri(e) {
	return [...e.matchAll(_i)].map((e) => e[1]);
}
function zi(e, t, n, r) {
	if (t === void 0) r.push(`${n}: missing (start from COPY_EN: { ...COPY_EN, ... })`);
	else if (typeof e == "string") {
		let i = yi(t);
		if (i) {
			r.push(`${n}: ${i}`);
			return;
		}
		let a = new Set(Ri(e));
		for (let e of Ri(t)) a.has(e) || r.push(`${n}: unknown placeholder {${e}} (allowed: ${[...a].map((e) => `{${e}}`).join(" ") || "none"})`);
	} else if (Array.isArray(e)) (!Array.isArray(t) || t.some((e) => yi(e) !== null)) && r.push(`${n}: must be an array of non-empty strings`);
	else if (!vi(t)) r.push(`${n}: must be an object`);
	else {
		for (let [i, a] of Object.entries(e)) zi(a, t[i], `${n}.${i}`, r);
		for (let i of Object.keys(t)) i in e || r.push(`${n}.${i}: unknown key`);
	}
}
function Bi(e) {
	let t = [];
	vi(e) || t.push("config: must be a plain object");
	let n = vi(e) ? e : void 0;
	if (Ii(Object.hasOwn(Pi, n?.mode) ? Pi[n.mode] : Fi, n, "", t), t.length > 0) throw new pi(t);
	return e;
}
//#endregion
//#region src/adapters/browser.js
function Vi() {
	return new Promise((e) => {
		typeof requestIdleCallback == "function" ? requestIdleCallback(() => e(), { timeout: 100 }) : setTimeout(e, 0);
	});
}
var Hi = (e) => new Promise((t) => setTimeout(t, e)), Ui = {
	now: () => performance.now(),
	epochMs: () => Date.now(),
	requestFrame: (e) => requestAnimationFrame(e),
	cancelFrame: (e) => cancelAnimationFrame(e)
}, Wi = (e) => typeof window < "u" && window.matchMedia(e).matches, Gi = (e, t) => globalThis.fetch(e, t);
async function Ki(e) {
	let t = new Uint8Array(await crypto.subtle.digest("SHA-256", e));
	return Array.from(t, (e) => e.toString(16).padStart(2, "0")).join("");
}
var qi = (e) => import(
	/* @vite-ignore */
	e
), Ji = () => typeof navigator < "u" && navigator.storage?.getDirectory ? () => navigator.storage.getDirectory() : null;
function Yi(e) {
	let t = [...document.querySelectorAll("link[rel=\"stylesheet\"][data-repo-chat]")].find((t) => t.getAttribute("href") === e);
	if (t?.dataset.repoChat === "loaded") return Promise.resolve();
	let n = t ?? document.createElement("link"), r = new Promise((t, r) => {
		n.addEventListener("load", () => {
			n.dataset.repoChat = "loaded", t();
		}, { once: !0 }), n.addEventListener("error", () => r(/* @__PURE__ */ Error(`stylesheet ${e} failed to load`)), { once: !0 });
	});
	return t || (n.rel = "stylesheet", n.href = e, n.dataset.repoChat = "pending", document.head.appendChild(n)), r;
}
function Xi() {
	let e = typeof navigator < "u" ? navigator.connection : void 0;
	return !e || !(e.saveData || typeof e.effectiveType == "string" && /(^|-)2g$/.test(e.effectiveType));
}
async function Zi(e, t) {
	try {
		if (typeof caches < "u" && await caches.match(e, { cacheName: t })) return 0;
	} catch {}
	try {
		let t = await fetch(e, { method: "HEAD" }), n = Number(t.headers.get("content-length"));
		return t.ok && Number.isFinite(n) && n > 0 ? n : null;
	} catch {
		return null;
	}
}
var Qi = /* @__PURE__ */ new Set();
function $i(e, t) {
	if (Qi.has(e) || typeof window > "u" || typeof caches > "u" || !Xi()) return;
	Qi.add(e);
	let n = async () => {
		try {
			let n = await caches.open(t);
			if (await n.match(e)) return;
			let r = await fetch(e, { priority: "low" });
			r.ok && await n.put(e, r);
		} catch {
			Qi.delete(e);
		}
	};
	typeof requestIdleCallback == "function" ? requestIdleCallback(() => void n(), { timeout: 4e3 }) : setTimeout(() => void n(), 2e3);
}
//#endregion
//#region src/adapters/corpus.js
var ea = class extends Error {
	constructor(e, { network: t, status: n }) {
		super(e), this.name = "CorpusFetchError", this.network = t, this.status = n;
	}
};
function ta(e) {
	async function t(t, n, r) {
		try {
			return await e.fetch(n, r);
		} catch (e) {
			throw e?.name === "AbortError" ? e : new ea(`${t} unreachable: ${e?.message ?? e}`, {
				network: !0,
				status: null
			});
		}
	}
	let n = (e, t) => new ea(`${e} failed: HTTP ${t.status}`, {
		network: !1,
		status: t.status
	});
	async function r(e) {
		let r = await t("manifest fetch", e, { cache: "no-cache" });
		if (!r.ok) throw n("manifest fetch", r);
		return r.json();
	}
	async function i(e, r) {
		let i = await t("corpus fetch", e, { signal: r });
		if (!i.ok) throw n("corpus fetch", i);
		if (!i.body) throw Error("corpus fetch returned no body stream");
		let a = Number(i.headers.get("content-length"));
		return {
			body: i.body,
			contentLength: Number.isFinite(a) && a > 0 ? a : null
		};
	}
	function a(e) {
		return typeof DecompressionStream == "function" ? e.pipeThrough(new DecompressionStream("gzip")) : null;
	}
	async function o(e, { signal: r, maxBytes: i, onBytes: a }) {
		let o = await t("snapshot fetch", e, { signal: r });
		if (!o.ok) throw n("snapshot fetch", o);
		if (!o.body) throw Error("snapshot fetch returned no body stream");
		let s = new Uint8Array(i), c = o.body.getReader(), l = 0;
		for (;;) {
			let { done: e, value: t } = await c.read();
			if (e) break;
			if (l + t.byteLength > i) throw await c.cancel(), Error(`snapshot is larger than its manifest's snapshot_bytes (${i}); the site published mismatched files`);
			s.set(t, l), l += t.byteLength, a(t.byteLength);
		}
		if (l !== i) throw Error(`snapshot download ended at ${l} of ${i} bytes`);
		return s;
	}
	return {
		fetchMeta: r,
		openCorpus: i,
		gunzip: a,
		readSnapshot: o
	};
}
//#endregion
//#region src/adapters/lattice.js
function na(e, t) {
	if (e && e.status === "ok" && e.result !== void 0) return e.result;
	throw Error(`${t} failed: ${e && e.error || "unknown wasm error"}`);
}
function ra(e, t) {
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
		let e = na(a().listCollections(), "listCollections");
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
		return na(a().upsert(e, t), "upsert");
	}
	function l(e, t, n) {
		return na(a().search(e, new Float32Array(t), n, { with_payload: !0 }), "search");
	}
	return {
		init: i,
		createCollection: s,
		upsert: c,
		search: l
	};
}
//#endregion
//#region src/core/search.js
var ia = 60, aa = 4;
function oa(e, t, n) {
	if (e.snapshot === null) throw Error(`corpus "${n}" was published without a snapshot (the action ran with snapshot: false); search mode installs <name>.lattice, so rebuild it with snapshot: true.`);
	if (e.snapshot.format !== 2) throw Error(`corpus "${n}" has a snapshot in format ${e.snapshot.format}; this chat installs format 2 (lattice-db >= v0.5.0).`);
	if (e.searchMode === "lexical") return {
		kind: "bm25",
		model: null
	};
	if (t === null) {
		if (e.searchMode === "hybrid") return {
			kind: "bm25",
			model: null
		};
		throw Error(`corpus "${n}" has no text index (search_mode vector), so it is searched by embedding the query: set search.embedder to its model, ${e.model} (dim ${e.dim}).`);
	}
	if (t.model !== e.model || t.dim !== e.dim) throw Error(`corpus "${n}" was built with ${e.model} (dim ${e.dim}) but search.embedder is ${t.model} (dim ${t.dim}); its query vectors would not match the corpus.`);
	return {
		kind: e.searchMode === "hybrid" ? "hybrid" : "dense",
		model: e.model
	};
}
function sa(e, t, n) {
	if (t.kind === "bm25") return {
		query: {
			text: e,
			model: "bm25"
		},
		limit: n,
		with_payload: !0
	};
	if (t.kind === "dense") return {
		query: {
			text: e,
			model: t.model
		},
		limit: n,
		with_payload: !0
	};
	let r = n * aa;
	return {
		prefetch: [{
			query: {
				text: e,
				model: "bm25"
			},
			limit: r
		}, {
			query: {
				text: e,
				model: t.model
			},
			limit: r
		}],
		query: { fusion: "rrf" },
		limit: n,
		with_payload: !0
	};
}
var ca = (e) => typeof e == "object" && !!e && !Array.isArray(e);
function la(e, t) {
	let n = null;
	try {
		n = JSON.parse(t);
	} catch {
		n = null;
	}
	if (e !== 200) {
		let t = ca(n) && typeof n.message == "string" ? `: ${n.message}` : "";
		throw Error(`search failed: HTTP ${e}${t}`);
	}
	let r = ca(n) && n.status === "ok" && ca(n.result) ? n.result.points : void 0;
	if (!Array.isArray(r)) throw Error("search failed: the engine answered with no points");
	return r.filter((e) => ca(e) && ca(e.payload) && (typeof e.id == "number" || typeof e.id == "string") && typeof e.score == "number").map((e) => ({
		id: e.id,
		score: e.score,
		payload: e.payload
	}));
}
function ua(e, t) {
	return e.flatMap(({ corpus: e, hits: t }, n) => t.map((t, r) => ({
		corpus: e,
		hit: t,
		rank: r + 1,
		order: n,
		rrf: 1 / (ia + r + 1)
	}))).sort((e, t) => t.rrf - e.rrf || e.order - t.order).slice(0, t).map(({ corpus: e, hit: t, rank: n }) => ({
		corpus: e,
		hit: t,
		rank: n
	}));
}
function da(e) {
	return async (t) => {
		let n = await e.embed(t);
		if (!Array.isArray(n) || n.length !== t.length) throw Error(`search.embedder returned ${Array.isArray(n) ? n.length : 0} vectors for ${t.length} text(s)`);
		for (let t of n) {
			let n = t instanceof Float32Array || Array.isArray(t) ? t.length : 0;
			if (n !== e.dim) throw Error(`search.embedder returned ${n} dimensions; ${e.model} is configured with ${e.dim}`);
		}
		return n;
	};
}
//#endregion
//#region src/adapters/lattice-search.js
var fa = [
	"importSnapshot",
	"route",
	"setEmbedder"
];
function pa(e, t) {
	let n = t instanceof Error ? t.message : String(t);
	try {
		let e = JSON.parse(n);
		e && typeof e.message == "string" && (n = e.message);
	} catch {}
	return /* @__PURE__ */ Error(`${e} failed: ${n}`);
}
function ma(e) {
	let t = null;
	function n() {
		if (!t) throw Error("LatticeDB wasm not initialized — call init() first");
		return t;
	}
	async function r() {
		let n = await e.init(), r = fa.filter((e) => typeof n[e] != "function");
		if (r.length > 0) throw Error(`this LatticeDB build has no ${r.join("/")}; search mode needs lattice-db >= v0.5.0 (config.wasm)`);
		t = n;
	}
	function i(e, t) {
		let r;
		try {
			r = n().importSnapshot(t, e, "replace");
		} catch (e) {
			throw pa("snapshot install", e);
		}
		if (!r || r.status !== "ok" || !r.result) throw pa("snapshot install", r?.error ?? "unknown wasm error");
		return r.result;
	}
	function a(e, t, r) {
		try {
			n().setEmbedder(e, t, r);
		} catch (e) {
			throw pa("setEmbedder", e);
		}
	}
	async function o(e, t) {
		let r;
		try {
			r = await n().route("POST", `/collections/${encodeURIComponent(e)}/points/query`, JSON.stringify(t));
		} catch (e) {
			throw pa("search", e);
		}
		return la(r.status, new TextDecoder().decode(r.body));
	}
	return {
		init: r,
		install: i,
		setEmbedder: a,
		query: o
	};
}
//#endregion
//#region src/adapters/openrouter.js
var ha = class extends Error {
	constructor(e, t, { quota: n = !1, resetAt: r = null } = {}) {
		super(e), this.name = "OpenRouterError", this.transient = t, this.quota = n, this.resetAt = r;
	}
}, ga = class extends ha {
	constructor(e) {
		super(`could not reach OpenRouter: ${e?.message ?? e}`, !0), this.name = "OpenRouterUnreachable", this.network = !0;
	}
}, _a = class extends ha {
	constructor(e) {
		super(e, !0), this.name = "OpenRouterServiceError", this.service = !0;
	}
};
function va(e, t, n) {
	return t >= 500 ? new _a(e) : new ha(e, n);
}
var ya = /free-models-per-day|per-?day|daily/i;
function ba(e, t) {
	let n = e?.metadata ?? {}, r = String(n.limit_source ?? ""), i = String(e?.message ?? "");
	if (!ya.test(r) && !ya.test(i)) return null;
	let a = n.headers?.["X-RateLimit-Reset"] ?? t?.headers?.get?.("X-RateLimit-Reset"), o = Number(a);
	return { resetAt: Number.isFinite(o) && o > 0 ? o : null };
}
function xa(e, t, n) {
	return new ha(`${e} failed: ${t}`, !1, {
		quota: !0,
		resetAt: n.resetAt
	});
}
var Sa = /ResourceExhausted|rate.?limit|overloaded/i;
async function Ca(e, t) {
	let n = await e.text();
	if (!e.ok) {
		let r = null;
		try {
			r = JSON.parse(n);
		} catch {}
		let i = e.status === 429 ? ba(r?.error, e) : null;
		throw i ? xa(t, r.error.message ?? "daily limit reached", i) : va(`${t} failed: ${e.status} - ${n}`, e.status, e.status === 429);
	}
	let r;
	try {
		r = JSON.parse(n);
	} catch {
		throw new ha(`${t} returned invalid JSON: ${n.slice(0, 200)}`, !1);
	}
	let i = r?.error;
	if (i) {
		let n = i.code ?? 0, r = i.message ?? "unknown error", a = ba(i, e);
		throw a ? xa(t, r, a) : va(`${t} failed${n ? ` (${n})` : ""}: ${r}`, n, n === 429 || Sa.test(r));
	}
	return r;
}
function wa(e) {
	if (typeof e.reasoning == "string" && e.reasoning) return e.reasoning;
	if (Array.isArray(e.reasoning_details)) {
		let t = "";
		for (let n of e.reasoning_details) typeof n?.text == "string" ? t += n.text : typeof n?.summary == "string" && (t += n.summary);
		if (t) return t;
	}
}
async function Ta(e, t) {
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
					let e = r.error.message ?? "unknown error", t = ba(r.error, null);
					throw t ? xa("Chat request", e, t) : va(`Chat request failed: ${e}`, r.error.code, r.error.code === 429 || Sa.test(e));
				}
				let a = r.choices?.[0]?.delta;
				if (!a) continue;
				let s = wa(a), c = typeof a.content == "string" && a.content ? a.content : void 0;
				(s || c) && t(s, c);
			}
		}
	} finally {
		n.releaseLock?.();
	}
}
function Ea(e, t) {
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
			if (t = e, !(e instanceof ha && e.transient) || n === a) break;
			await c(n);
		}
		throw t;
	}
	let u = (e, r, i) => t.fetch(`${n}${e}`, {
		method: "POST",
		headers: s(r),
		body: i
	}).catch((e) => {
		throw new ga(e);
	});
	async function d(e, t, n) {
		if (e.length === 0) return [];
		let r = await l(async () => Ca(await u("/embeddings", t, JSON.stringify({
			model: n,
			input: e
		})), "Embedding request"));
		if (!Array.isArray(r?.data)) throw new ha("Embedding request returned no embeddings.", !1);
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
				let t = (await Ca(e, "Chat request")).choices?.[0]?.message?.content;
				if (t === void 0) throw Error("Chat request returned no message content");
				d(void 0, t);
			} else {
				if (!e.body) throw new ha("Chat request returned no response stream", !0);
				await Ta(e.body, d);
			}
		};
		for (let e = 1;; e++) try {
			return await f(), s;
		} catch (t) {
			if (!(t instanceof ha && t.transient) || l || e >= a) throw t;
			await c(e);
		}
	}
	async function m(e, t, n, r, i) {
		let a = await l(async () => Ca(await u("/rerank", n, JSON.stringify({
			model: i,
			query: e,
			documents: t,
			top_n: r,
			return_documents: !1
		})), "Rerank request"));
		if (!Array.isArray(a?.results)) throw new ha("Rerank request returned no results.", !1);
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
//#region src/adapters/opfs.js
var Da = [
	10,
	25,
	50,
	100,
	200,
	400
], Oa = class extends Error {
	constructor(e, t) {
		super(`${e}: ${t?.name ?? "Error"}: ${t?.message ?? t}`, { cause: t }), this.name = "CacheCleanupError";
	}
};
function ka(e, t, n) {
	let { corpusFileName: r, metaFileName: i, parseCorpusFileName: a, parseMetaFileName: o, parsePartialFileName: s, partialFileName: c } = t;
	async function l(e, t) {
		for (let r = 0;; r++) try {
			return await t();
		} catch (t) {
			if (t?.name !== "NoModificationAllowedError" || r >= Da.length) throw new Oa(e, t);
			await n.sleep(Da[r]);
		}
	}
	function u(e, t) {
		return l(`could not remove ${t}`, async () => {
			try {
				await e.removeEntry(t);
			} catch (e) {
				if (e?.name !== "NotFoundError") throw e;
			}
		});
	}
	async function d() {
		if (!n.getDirectory) return null;
		try {
			return await n.getDirectory();
		} catch {
			return null;
		}
	}
	async function f(t, n, i) {
		let a = await d();
		if (!a) return null;
		try {
			let o = await (await a.getFileHandle(r(e, t, n))).getFile();
			return i !== null && o.size !== i ? null : o;
		} catch {
			return null;
		}
	}
	async function p(t, n) {
		let i = await d();
		if (!i) return null;
		let a = c(e, t, n), o = r(e, t, n), s, f;
		try {
			s = await i.getFileHandle(a, { create: !0 }), f = await s.createWritable({ keepExistingData: !1 });
		} catch {
			return s && await u(i, a), null;
		}
		let p = "open";
		return {
			async write(e) {
				p === "open" && await f.write(e);
			},
			async finalize() {
				if (p === "open") {
					if (await f.close(), p = "closed", typeof s.move != "function") throw new Oa(`could not commit ${a}`, /* @__PURE__ */ Error("this browser cannot move OPFS files"));
					await u(i, o), await l(`could not commit ${a}`, () => s.move(o)), p = "done";
				}
			},
			async discard() {
				p !== "done" && (p === "open" && (p = "closed", await f.abort()), await u(i, a), p = "done");
			}
		};
	}
	async function m(t, n, r) {
		let a = await d();
		if (a) try {
			let o = await (await a.getFileHandle(i(e, t, n), { create: !0 })).createWritable({ keepExistingData: !1 });
			await o.write(JSON.stringify(r)), await o.close();
		} catch {}
	}
	async function h(t, n) {
		let r = [], i = [
			["corpus", a],
			["meta", o],
			["partial", s]
		];
		try {
			for await (let [a, o] of t) {
				if (o.kind !== "file") continue;
				let t = i.map(([t, r]) => [t, r(e, n, a)]).find(([, e]) => e);
				if (t) try {
					let e = await o.getFile();
					r.push({
						name: a,
						sha: t[1],
						kind: t[0],
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
	async function g(e) {
		let t = await d();
		if (!t) return null;
		let n = await h(t, e), r = new Map(n.filter((e) => e.kind === "meta").map((e) => [e.sha, e.file])), i = n.filter((e) => e.kind === "corpus" && r.has(e.sha)).sort((e, t) => t.lastModified - e.lastModified);
		for (let e of i) try {
			return {
				sha: e.sha,
				file: e.file,
				rawMeta: JSON.parse(await r.get(e.sha).text())
			};
		} catch {}
		return null;
	}
	async function _(e, t) {
		if (typeof t != "string" || t === "") return;
		let n = await d();
		if (!n) return;
		let r = [];
		for (let i of await h(n, e)) if (i.sha !== t || i.kind === "partial") try {
			await u(n, i.name);
		} catch (e) {
			r.push(e);
		}
		if (r.length > 0) throw new Oa(`could not prune ${r.length} file(s)`, Error(r.map((e) => e.message).join("; ")));
	}
	return {
		getCachedCorpus: f,
		createCorpusWriter: p,
		writeMeta: m,
		newestOffline: g,
		pruneStale: _
	};
}
//#endregion
//#region src/adapters/storage.js
function Aa(e, t) {
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
//#region src/core/cache-names.js
var ja = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function Ma(e) {
	let t = (t, n, r) => `${t}~${n}@${r}.${e}`, n = (e) => (t, n, r) => {
		let i = RegExp(`^${ja(`${t}~${n}@`)}([0-9a-f]{7,64})${ja(e)}$`).exec(r);
		return i ? i[1] : null;
	};
	return Object.freeze({
		corpusFileName: t,
		metaFileName: (e, t, n) => `${e}~${t}@${n}.meta.json`,
		partialFileName: (e, n, r) => `${t(e, n, r)}.part`,
		parseCorpusFileName: n(`.${e}`),
		parseMetaFileName: n(".meta.json"),
		parsePartialFileName: n(`.${e}.part`)
	});
}
var Na = Ma("jsonl"), Pa = Ma("lattice"), { corpusFileName: Fa, metaFileName: Ia, partialFileName: La, parseCorpusFileName: Ra, parseMetaFileName: za, parsePartialFileName: Ba } = Na, Va = 200, Ha = "…";
function Ua(e) {
	if (typeof e != "string") return null;
	try {
		let t = new URL(e);
		return t.protocol === "http:" || t.protocol === "https:" ? t.href : null;
	} catch {
		return null;
	}
}
var Wa = (e) => typeof e == "string" ? e.trim() : "";
function Ga(e) {
	let t = e.split("\n"), n = t.filter((e) => !/^\s{0,3}#{1,6}\s/.test(e));
	return (n.some((e) => e.trim() !== "") ? n : t).map((e) => e.replace(/^\s{0,3}#{1,6}\s+/, "").replace(/^\s*(?:[-*+]|\d+[.)]|>)\s+/, "")).join(" ").replace(/```\w*/g, " ").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/(\*\*|__|`)/g, "").replace(/\s+/g, " ").trim();
}
function Ka(e) {
	let t = String(e).toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [];
	return [...new Set(t)].sort((e, t) => t.length - e.length);
}
var qa = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function Ja(e, t, n) {
	let r = Ga(e);
	if (r === "") return [];
	let i = Ka(t), a = r.toLowerCase(), o = Math.min(...i.map((e) => a.indexOf(e)).filter((e) => e >= 0), Infinity), s = o === Infinity ? 0 : Math.max(0, o - Math.floor(n / 3));
	s > 0 && (s = r.indexOf(" ", s) + 1 || s);
	let c = Math.min(r.length, s + n);
	if (c < r.length) {
		let e = r.lastIndexOf(" ", c);
		e > s && (c = e);
	}
	let l = (s > 0 ? Ha : "") + r.slice(s, c).trim() + (c < r.length ? Ha : "");
	if (i.length === 0) return [{
		text: l,
		hit: !1
	}];
	let u = RegExp(`(${i.map(qa).join("|")})`, "giu");
	return l.split(u).filter((e) => e !== "").map((e) => ({
		text: e,
		hit: i.includes(e.toLowerCase())
	}));
}
function Ya({ corpus: e, hit: t }, n, r) {
	let i = t.payload, a = Array.isArray(i.heading_path) ? i.heading_path.map(Wa).filter((e) => e !== "") : [], o = Wa(i.title) || a.at(-1) || Wa(i.path) || `#${t.id}`;
	return {
		key: `${e.id}:${t.id}`,
		corpusId: e.id,
		url: Ua(i.url),
		title: o.length > Va ? `${o.slice(0, Va)}${Ha}` : o,
		crumbs: a,
		snippet: typeof i.text == "string" ? Ja(i.text, n, r) : []
	};
}
async function Xa(e, { query: t, corpora: n, topK: r, snippetChars: i }) {
	return ua(await Promise.all(n.map(async (n) => ({
		corpus: n,
		hits: await t(n.collection, sa(e, n.plan, r))
	}))), r).map((t) => Ya(t, e, i));
}
//#endregion
//#region src/core/ask-errors.js
function Za(e) {
	let t = String(e?.message ?? e);
	return e?.quota ? {
		kind: "quota",
		resetAt: e.resetAt ?? null
	} : e?.network === !0 ? {
		kind: "network",
		resetAt: null
	} : e?.service === !0 ? {
		kind: "service",
		resetAt: null
	} : /\b401\b|\b403\b|invalid.{0,20}key|no auth/i.test(t) ? {
		kind: "key",
		resetAt: null
	} : /dimensions but this corpus/.test(t) ? {
		kind: "corpus",
		resetAt: null
	} : e?.transient === !0 ? {
		kind: "rate",
		resetAt: null
	} : {
		kind: "generic",
		resetAt: null
	};
}
function Qa(e) {
	return /gzip|decompress|inflate|corrupt/i.test(String(e?.message)) ? "decompress" : "corpus";
}
function $a(e) {
	return e?.network === !0 ? "manifest" : "unavailable";
}
function eo(e) {
	return Number.isInteger(e?.status) ? "unavailable" : "corpus";
}
//#endregion
//#region src/core/template.js
function $(e, t) {
	return e.replace(/\{(\w+)\}/g, (n, r) => {
		if (!Object.hasOwn(t, r)) throw Error(`copy template ${JSON.stringify(e)} names {${r}} but no value was given`);
		return String(t[r]);
	});
}
//#endregion
//#region src/core/consent.js
function to(e, t) {
	let n = e.filter((e) => !e.file);
	if (n.length === 0) return null;
	let r = n.map((e) => ({
		id: e.corpus.id,
		bytes: e.meta.gzBytes
	}));
	return {
		corpora: r,
		wasmBytes: t,
		totalBytes: r.reduce((e, t) => e + t.bytes, 0) + (t ?? 0),
		storedBytes: n.reduce((e, t) => e + t.meta.bytes, 0)
	};
}
function no(e, t) {
	return e < 999950 ? $(t.size.kb, { n: (e / 1e3).toFixed(1) }) : $(t.size.mb, { n: (e / 1e6).toFixed(1) });
}
//#endregion
//#region src/core/search-meta.js
var ro = /^[0-9a-f]{7,64}$/, io = /^[0-9a-f]{64}$/, ao = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, oo = [
	"lexical",
	"vector",
	"hybrid"
], so = (e) => Number.isSafeInteger(e) && e >= 0;
function co(e, t) {
	let n = (e) => /* @__PURE__ */ Error(`corpus "${t}" manifest: ${e}`);
	if (typeof e != "object" || !e || Array.isArray(e)) throw n("is not a JSON object");
	let r = e;
	if (typeof r.commit_sha != "string" || !ro.test(r.commit_sha)) throw n("commit_sha must be a hex commit string");
	if (typeof r.repo != "string" || !ao.test(r.repo)) throw n("repo must be \"owner/name\"");
	for (let e of ["points", "files"]) if (!so(r[e])) throw n(`${e} must be a non-negative integer`);
	if (typeof r.generated_at != "string") throw n("generated_at must be a string");
	if (!oo.includes(r.search_mode)) throw n(`search_mode must be one of ${oo.join(", ")}`);
	let i = r.search_mode, a = i !== "lexical";
	if (a && (typeof r.model != "string" || r.model.trim() === "")) throw n(`model must name the embedding model of a ${i} corpus`);
	if (!so(r.dim) || a && r.dim < 1) throw n(`dim must be ${a ? "a positive" : "a non-negative"} integer`);
	return {
		commitSha: r.commit_sha,
		repo: r.repo,
		points: r.points,
		files: r.files,
		generatedAt: r.generated_at,
		searchMode: i,
		model: a ? r.model : null,
		dim: r.dim,
		snapshot: lo(r, n)
	};
}
function lo(e, t) {
	if ([
		e.snapshot_bytes,
		e.snapshot_sha256,
		e.snapshot_format
	].every((e) => e == null)) return null;
	if (!Number.isSafeInteger(e.snapshot_bytes) || e.snapshot_bytes < 1) throw t("snapshot_bytes must be a positive integer");
	if (typeof e.snapshot_sha256 != "string" || !io.test(e.snapshot_sha256)) throw t("snapshot_sha256 must be 64 lowercase hex characters");
	if (!Number.isSafeInteger(e.snapshot_format) || e.snapshot_format < 1) throw t("snapshot_format must be a positive integer");
	return {
		bytes: e.snapshot_bytes,
		sha256: e.snapshot_sha256,
		format: e.snapshot_format
	};
}
//#endregion
//#region src/state/load-gate.js
var uo = class extends Error {
	constructor() {
		super("load aborted"), this.name = "AbortError";
	}
}, fo = class extends Error {
	constructor() {
		super("load failed"), this.name = "FailedError";
	}
};
function po(e, t) {
	let n = null, r = null, i = !1, a = null, o = (e) => {
		if (e.aborted) throw new uo();
	};
	function s() {
		e.progress.loadedBytes = 0, e.progress.totalBytes = 0, e.progress.indexed = 0, e.progress.totalPoints = 0;
	}
	function c(t, n) {
		return e.status = "error", e.error = {
			kind: t,
			message: n?.message ? String(n.message) : String(n)
		}, new fo();
	}
	function l(i) {
		if (e.status === "ready") return Promise.resolve();
		if (n) return n;
		let a = { aborted: !1 };
		return r = a, e.error = null, e.offline = !1, s(), n = i(a).catch((t) => {
			a.aborted || t?.name === "AbortError" || t instanceof fo || e.error || c("corpus", t);
		}).finally(() => {
			e.status !== "ready" && (n = null), r === a && (r = null), t.settled();
		}), n;
	}
	function u() {
		e.status !== "ready" && e.status !== "idle" && (r && (r.aborted = !0), i = !1, a?.reject(new uo()), a = null, e.consent = null, t.cancelIo(), n = null, e.error = null, e.offline = !1, s(), e.status = "idle");
	}
	function d() {
		a &&= (i = !0, e.consent = null, a.resolve(), null);
	}
	async function f(t, n) {
		if (i) return;
		let r = await n();
		o(t), r !== null && (e.consent = r, e.status = "consent", await new Promise((e, t) => {
			a = {
				resolve: e,
				reject: t
			};
		}), o(t));
	}
	return {
		ensureReady: l,
		abortLoad: u,
		accept: d,
		consentTo: f,
		fail: c,
		throwIfAborted: o
	};
}
async function mo({ chat: e, net: t, cache: n, gate: r, validate: i }, a, o) {
	try {
		let e = await t.fetchMeta(o.metaUrl);
		return {
			corpus: o,
			raw: e,
			meta: i(e, o.id),
			file: null
		};
	} catch (t) {
		r.throwIfAborted(a);
		let s = await n.newestOffline(o.id);
		if (r.throwIfAborted(a), !s) throw r.fail($a(t), t);
		let c;
		try {
			c = i(s.rawMeta, o.id);
		} catch {
			throw r.fail($a(t), t);
		}
		if (c.commitSha !== s.sha) throw r.fail($a(t), t);
		return e.offline = !0, {
			corpus: o,
			raw: s.rawMeta,
			meta: c,
			file: s.file
		};
	}
}
//#endregion
//#region src/state/search-loader.js
function ho({ chat: e, corpora: t, embedder: n, ports: r }) {
	let { search: i, cache: a, net: o, wasmBytes: s, sha256: c, reportCacheFault: l } = r, u = null, d = null, f = !1, p = po(e, {
		cancelIo() {
			u?.abort();
			let e = d;
			d = null, e && e.discard().catch(l);
		},
		settled() {
			u = null, d = null;
		}
	}), { fail: m, throwIfAborted: h } = p, g = (t, n) => mo({
		chat: e,
		net: o,
		cache: a,
		gate: p,
		validate: co
	}, t, n), _ = async (e, t) => await c(t) === e.meta.snapshot.sha256;
	async function v(r) {
		e.status = "manifest";
		let o = [];
		for (let e of t) o.push(await g(r, e));
		let c;
		try {
			c = o.map((e) => oa(e.meta, n, e.corpus.id));
		} catch (e) {
			throw m("config", e);
		}
		for (let e of o) e.file ||= await a.getCachedCorpus(e.corpus.id, e.meta.commitSha, e.meta.snapshot.bytes), e.bytes = e.file ? new Uint8Array(await e.file.arrayBuffer()) : null, e.bytes && !await _(e, e.bytes) && (l(/* @__PURE__ */ Error(`cached snapshot of "${e.corpus.id}" at ${e.meta.commitSha} failed its checksum; downloading it again`)), e.file = null, e.bytes = null), h(r);
		let u = (e) => ({
			corpus: e.corpus,
			file: e.file,
			meta: {
				gzBytes: e.meta.snapshot.bytes,
				bytes: e.meta.snapshot.bytes
			}
		});
		await p.consentTo(r, async () => o.some((e) => !e.file) ? to(o.map(u), f ? 0 : await s()) : null), e.status = "wasm-init";
		try {
			await i.init(), !f && n !== null && c.some((e) => e.kind !== "bm25") && i.setEmbedder(n.model, n.dim, da(n));
		} catch (e) {
			throw m("wasm", e);
		}
		f = !0, h(r), e.progress.totalBytes = o.reduce((e, t) => e + t.meta.snapshot.bytes, 0), e.progress.totalPoints = o.reduce((e, t) => e + t.meta.points, 0);
		let d = [];
		for (let [t, n] of o.entries()) {
			let o = n.bytes !== null, s = o ? y(n) : await b(r, n);
			h(r), e.status = "indexing";
			try {
				i.install(n.corpus.id, s);
			} catch (e) {
				throw m("corpus", e);
			}
			n.bytes = null, e.progress.indexed += n.meta.points, o || await x(r, n, s), await a.writeMeta(n.corpus.id, n.meta.commitSha, n.raw), await a.pruneStale(n.corpus.id, n.meta.commitSha).catch(l), h(r), d.push({
				id: n.corpus.id,
				collection: n.corpus.id,
				commit: n.meta.commitSha,
				repo: n.meta.repo,
				files: n.meta.files,
				chunks: n.meta.points,
				plan: c[t],
				generatedAt: n.meta.generatedAt
			});
		}
		e.corpora = d, e.status = "ready";
	}
	function y(t) {
		return e.status = "loading-cached", e.progress.loadedBytes += t.bytes.byteLength, t.bytes;
	}
	async function b(t, n) {
		e.status = "downloading", u = new AbortController();
		let r;
		try {
			r = await o.readSnapshot(n.corpus.snapshotUrl, {
				signal: u.signal,
				maxBytes: n.meta.snapshot.bytes,
				onBytes: (t) => {
					e.progress.loadedBytes += t;
				}
			});
		} catch (e) {
			throw h(t), e?.name === "AbortError" ? e : m(eo(e), e);
		}
		if (h(t), !await _(n, r)) throw m("corpus", /* @__PURE__ */ Error(`the snapshot of "${n.corpus.id}" does not match its manifest's snapshot_sha256, so it was not installed`));
		return r;
	}
	async function x(e, t, n) {
		d = await a.createCorpusWriter(t.corpus.id, t.meta.commitSha).catch((e) => (l(e), null));
		let r = d;
		if (r) try {
			await r.write(n), h(e), await r.finalize();
		} catch (t) {
			if (d === r && await r.discard().catch(l), e.aborted) throw t;
			l(t);
		} finally {
			d = null;
		}
	}
	return {
		ensureReady: () => p.ensureReady(v),
		abortLoad: p.abortLoad,
		accept: p.accept
	};
}
//#endregion
//#region src/state/search-session.svelte.js
function go(e, t) {
	let n = Xt({
		status: "idle",
		consent: null,
		progress: {
			loadedBytes: 0,
			totalBytes: 0,
			indexed: 0,
			totalPoints: 0
		},
		corpora: [],
		offline: !1,
		error: null,
		draft: "",
		searching: !1,
		results: null,
		searchError: null
	}), r = ho({
		chat: n,
		corpora: e.corpora,
		embedder: e.search.embedder,
		ports: t
	}), i = 0;
	async function a(r) {
		let a = String(r ?? "").trim();
		if (a === "" || n.status !== "ready") return !1;
		let o = ++i;
		n.searching = !0, n.searchError = null;
		try {
			let r = await Xa(a, {
				query: t.search.query,
				corpora: n.corpora,
				topK: e.search.topK,
				snippetChars: e.search.snippetChars
			});
			o === i && (n.results = {
				query: a,
				items: r
			});
		} catch (e) {
			o === i && (n.searchError = { message: e?.message ? String(e.message) : String(e) });
		} finally {
			o === i && (n.searching = !1);
		}
		return !0;
	}
	return {
		chat: n,
		search: a,
		ensureReady: r.ensureReady,
		abortLoad: r.abortLoad,
		acceptDownload: r.accept
	};
}
//#endregion
//#region src/core/prompt.js
function _o(e) {
	return Math.max(0, Math.min(100, (1 - e) * 100));
}
function vo(e, t, n, r, i) {
	return `https://github.com/${e}/blob/${t}/${n}#L${r}-L${i}`;
}
function yo(e, { repo: t, path: n, startLine: r, endLine: i, language: a, text: o }) {
	return `[${e}] ${t} ${n} lines ${r}–${i}\n\`\`\`${a || ""}\n${o}\n\`\`\``;
}
function bo(e) {
	return e.map((e) => `GitHub repository ${e.repo}, commit ${e.commit}`).join("; ");
}
function xo(e, t, n) {
	return `You are the code assistant for the ${e} codebase (${bo(t)}). Answer questions about this codebase using ONLY the numbered code context below.\n\nRules:\n- Cite the context blocks you draw from inline with bracketed numbers, e.g. [1] or [2].\n- If the context does not contain what is needed to answer, say plainly that the retrieved code does not cover it. Never invent file names, functions, or behavior.\n- Be concise and technical. Prefer short code excerpts over prose when they answer better.\n\nContext:\n${n}`;
}
var So = "No relevant code was found in the corpus for this question.";
//#endregion
//#region src/core/rag.js
function Co(e, t) {
	return e.flatMap(({ corpus: e, hits: t }) => t.map((t) => ({
		corpus: e,
		id: Number(t.id),
		score: t.score,
		payload: t.payload ?? {}
	})).filter((e) => typeof e.payload.text == "string")).sort((e, t) => e.score - t.score).slice(0, t);
}
function wo(e, t, n) {
	return e.slice(0, n).filter(({ index: e }) => Number.isInteger(e) && e >= 0 && e < t.length).map(({ index: e }) => t[e]);
}
function To(e, t) {
	let n = e.payload, r = Number(n.start_line), i = Number(n.end_line);
	return {
		n: t,
		corpusId: e.corpus.id,
		repo: e.corpus.repo,
		path: n.path,
		startLine: r,
		endLine: i,
		score: e.score,
		relevancePct: _o(e.score),
		url: vo(e.corpus.repo, e.corpus.commit, n.path, r, i)
	};
}
async function Eo(e, t, n) {
	let { openrouter: r, lattice: i, corpora: a, embedding: o, retrieval: s, productName: c, rerankModel: l, chatModel: u, apiKey: d, onPhase: f, onDelta: p } = n;
	f("retrieving");
	let m = await r.getEmbedding(e, d, o.model);
	if (!Array.isArray(m) || m.length !== o.dim) throw Error(`The embedding model returned ${m?.length ?? 0} dimensions but this corpus was built with ${o.dim}. The site's embedding model and the published corpus are out of sync — the corpus needs a rebuild against the current model.`);
	let h = s.topK * s.rerankMultiplier, g = Co(a.map((e) => ({
		corpus: e,
		hits: i.search(e.collection, m, h)
	})), h), _;
	g.length > 1 ? (f("reranking"), _ = wo(await r.rerank(e, g.map((e) => e.payload.text), d, s.topK, l), g, s.topK)) : _ = g.slice(0, s.topK);
	let v = _.map((e, t) => To(e, t + 1)), y = _.length > 0 ? _.map((e, t) => yo(t + 1, {
		repo: e.corpus.repo,
		path: e.payload.path,
		startLine: Number(e.payload.start_line),
		endLine: Number(e.payload.end_line),
		language: e.payload.language,
		text: e.payload.text
	})).join("\n\n") : So;
	return f("thinking"), {
		answer: await r.chat([...t, {
			role: "user",
			content: e
		}], xo(c, a, y), d, {
			onDelta: p,
			model: u
		}),
		sources: v
	};
}
//#endregion
//#region src/state/conversation.svelte.js
var Do = [
	"rate",
	"quota",
	"key",
	"network",
	"service"
];
function Oo(e) {
	let { chat: t } = e, n = Xt({
		messages: [],
		nextId: 0,
		draft: "",
		keyDraft: "",
		asking: !1,
		askError: null,
		cleared: null
	}), r = "", i = () => t.status === "ready" && t.keyState === "set" && !n.asking, a = (e) => e.map((e) => ({
		role: e.role,
		content: e.text
	}));
	async function o(r, i) {
		n.asking = !0, n.askError = null;
		try {
			let t = await e.ask(r, i);
			n.messages.push({
				id: n.nextId++,
				role: "assistant",
				text: t.answer,
				sources: t.sources,
				reasoning: t.reasoning,
				reasoningMs: t.reasoningMs
			});
		} catch {
			let e = t.error?.kind;
			n.askError = {
				kind: Do.includes(e) ? e : "generic",
				resetAt: e === "quota" ? t.error?.resetAt ?? null : null,
				detail: e === "corpus" ? t.error?.message : null
			};
		} finally {
			n.asking = !1;
		}
	}
	function s(e) {
		let t = (typeof e == "string" ? e : n.draft).trim();
		if (!t || !i()) return !1;
		typeof e != "string" && (n.draft = ""), n.cleared = null, r = t;
		let s = a(n.messages);
		return n.messages.push({
			id: n.nextId++,
			role: "user",
			text: t
		}), o(t, s), !0;
	}
	function c() {
		r && !n.asking && o(r, a(n.messages.slice(0, -1)));
	}
	function l() {
		n.askError = null;
	}
	function u(t) {
		e.setChatModel(t), n.askError = null, c();
	}
	function d() {
		n.asking || n.messages.length === 0 || (n.cleared = {
			messages: n.messages,
			askError: n.askError,
			lastQuestion: r
		}, n.messages = [], n.askError = null, r = "");
	}
	function f() {
		if (!n.cleared || n.asking) return;
		let { messages: e, askError: t, lastQuestion: i } = n.cleared;
		n.messages = e, n.askError = t, r = i, n.cleared = null;
	}
	return {
		convo: n,
		canAsk: i,
		submit: s,
		retry: c,
		dismissError: l,
		retryOnModel: u,
		clear: d,
		undoClear: f
	};
}
//#endregion
//#region src/core/jsonl.js
function ko(e, t) {
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
function Ao(e) {
	let t = JSON.parse(e);
	return t?.t === "point" ? {
		id: t.id,
		vector: t.vector,
		payload: t.payload
	} : null;
}
function jo(e) {
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
var Mo = /^[0-9a-f]{7,64}$/, No = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, Po = (e) => Number.isSafeInteger(e) && e >= 0;
function Fo(e, t) {
	let n = (e) => /* @__PURE__ */ Error(`corpus "${t}" manifest: ${e}`);
	if (typeof e != "object" || !e || Array.isArray(e)) throw n("is not a JSON object");
	if (typeof e.commit_sha != "string" || !Mo.test(e.commit_sha)) throw n("commit_sha must be a hex commit string");
	if (!Number.isSafeInteger(e.dim) || e.dim < 1) throw n("dim must be a positive integer");
	if (typeof e.model != "string" || e.model.trim() === "") throw n("model must name the embedding model");
	if (typeof e.repo != "string" || !No.test(e.repo)) throw n("repo must be \"owner/name\"");
	for (let t of [
		"points",
		"files",
		"bytes",
		"gz_bytes"
	]) if (!Po(e[t])) throw n(`${t} must be a non-negative integer`);
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
function Io(e) {
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
function Lo({ chat: e, corpora: t, upsertBatch: n, ports: r }) {
	let { lattice: i, cache: a, net: o, idleYield: s, wasmBytes: c, reportCacheFault: l } = r, u = null, d = null, f = !1, p = po(e, {
		cancelIo() {
			u?.abort();
			let e = d;
			d = null, e && e.discard().catch(l);
		},
		settled() {
			u = null, d = null;
		}
	}), { fail: m, throwIfAborted: h } = p, g = (t, n) => mo({
		chat: e,
		net: o,
		cache: a,
		gate: p,
		validate: Fo
	}, t, n);
	async function _() {
		let e = d;
		d = null, e && await e.discard().catch(l);
	}
	async function v(n) {
		e.status = "manifest";
		let r = [];
		for (let e of t) r.push(await g(n, e));
		let o;
		try {
			o = Io(r.map((e) => ({
				id: e.corpus.id,
				meta: e.meta
			})));
		} catch (e) {
			throw m("config", e);
		}
		for (let e of r) e.file ||= await a.getCachedCorpus(e.corpus.id, e.meta.commitSha, e.meta.bytes), h(n);
		await p.consentTo(n, async () => r.some((e) => !e.file) ? to(r, f ? 0 : await c()) : null), e.status = "wasm-init";
		try {
			await i.init();
		} catch (e) {
			throw m("wasm", e);
		}
		f = !0, h(n), e.progress.totalBytes = r.reduce((e, t) => e + (t.file ? t.file.size : t.meta.gzBytes), 0), e.progress.totalPoints = r.reduce((e, t) => e + t.meta.points, 0);
		let s = [];
		for (let e of r) {
			let t = e.file ? await y(n, e) : await b(n, e);
			h(n), s.push({
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
		return e.status = "loading-cached", x(t, n.file.stream(), {
			collection: n.corpus.id,
			expectedDim: n.meta.dim,
			tee: null,
			countBytes: !0,
			onDrained: async () => {
				await a.writeMeta(n.corpus.id, n.meta.commitSha, n.raw), await a.pruneStale(n.corpus.id, n.meta.commitSha).catch(l);
			}
		});
	}
	async function b(t, n) {
		let { id: r } = n.corpus, i = n.meta.commitSha;
		e.status = "downloading", u = new AbortController();
		let s;
		try {
			s = await o.openCorpus(n.corpus.gzUrl, u.signal);
		} catch (e) {
			throw h(t), e?.name === "AbortError" ? e : m(eo(e), e);
		}
		s.contentLength !== null && (e.progress.totalBytes += s.contentLength - n.meta.gzBytes);
		let c = s.body.pipeThrough(new TransformStream({ transform(t, n) {
			e.progress.loadedBytes += t.byteLength, n.enqueue(t);
		} })), f = o.gunzip(c);
		if (f === null) throw m("decompress", /* @__PURE__ */ Error("this browser lacks DecompressionStream (gzip) support"));
		if (d = await a.createCorpusWriter(r, i).catch((e) => (l(e), null)), t.aborted) throw await _(), new uo();
		let p = async () => {
			e.status = "caching";
			let t = d;
			if (d = null, t) try {
				await t.finalize(), await a.writeMeta(r, i, n.raw);
			} catch (e) {
				l(e), await t.discard().catch(l);
			}
			await a.pruneStale(r, i).catch(l);
		};
		try {
			return await x(t, f, {
				collection: r,
				expectedDim: n.meta.dim,
				tee: d,
				countBytes: !1,
				onDrained: p
			});
		} catch (e) {
			throw await _(), t.aborted || e?.name === "AbortError" ? e : m(Qa(e), e);
		}
	}
	async function x(t, r, { collection: a, expectedDim: o, tee: c, countBytes: l, onDrained: u }) {
		let d = r.getReader(), f = new TextDecoder(), p = null, m = [], g = async () => {
			m.length !== 0 && (i.upsert(a, m), e.progress.indexed += m.length, m = [], await s(), h(t));
		}, _ = jo(async (e) => {
			if (!p) {
				p = ko(e, o), i.createCollection(a, p.dim);
				return;
			}
			let t = Ao(e);
			t && m.push(t), m.length >= n && await g();
		});
		try {
			for (;;) {
				h(t);
				let { done: n, value: r } = await d.read();
				if (n) break;
				c && await c.write(r), l && (e.progress.loadedBytes += r.byteLength), await _.push(f.decode(r, { stream: !0 }));
			}
			await _.push(f.decode()), await _.end();
		} finally {
			d.releaseLock?.();
		}
		if (!p) throw Error("corpus stream ended before a header line");
		return h(t), await u(), h(t), e.status = "indexing", await g(), p;
	}
	return {
		ensureReady: () => p.ensureReady(v),
		abortLoad: p.abortLoad,
		accept: p.accept
	};
}
//#endregion
//#region src/state/session.svelte.js
function Ro(e, t) {
	let { keys: n, clock: r } = t, i = e.provider.chatModel, a = Xt({
		status: "idle",
		consent: null,
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
		keyForgotten: !1,
		chatModel: n.getChatModel() || i,
		msgPhase: null,
		stream: null
	}), o = Lo({
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
	let l = null;
	function u(e) {
		let t = String(e ?? "").trim();
		t && (n.setKey(t), l = null, a.keyForgotten = !1, a.keyState = "set", a.error?.kind === "key" && (a.error = null));
	}
	function d() {
		let e = n.getKey();
		e && (l = e, n.clearKey(), a.keyForgotten = !0, a.keyState = "missing");
	}
	function f() {
		l !== null && u(l);
	}
	function p(e, t, n = {}) {
		a.error = {
			kind: e,
			message: t?.message ? String(t.message) : String(t),
			...n
		};
	}
	async function m(i, o) {
		if (a.status !== "ready") throw Error("the corpus is not ready yet");
		let s = n.getKey();
		if (!s) {
			let e = /* @__PURE__ */ Error("no OpenRouter key set — add one to start asking");
			throw p("key", e), e;
		}
		a.stream = {
			reasoningText: "",
			answerText: "",
			reasoningMs: 0
		};
		let c = "", l = "", u = "", d = 0, f = 0, m = () => {
			d = 0, a.stream && (l &&= (a.stream.reasoningText += l, ""), u &&= (a.stream.answerText += u, ""));
		}, h = () => {
			d ||= r.requestFrame(m);
		}, g = ({ reasoning: e, content: t }) => {
			e && (f ||= r.now(), c += e, l += e, h()), t && (a.msgPhase !== "writing" && (a.msgPhase = "writing", f && a.stream && a.stream.reasoningMs === 0 && (a.stream.reasoningMs = r.now() - f)), u += t, h());
		};
		try {
			let n = await Eo(i, o, {
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
				"network",
				"service",
				"rate",
				"quota",
				"key",
				"generic"
			].includes(a.error?.kind) && (a.error = null);
			let l = a.stream?.reasoningMs || (f ? r.now() - f : 0);
			return {
				...n,
				reasoning: c,
				reasoningMs: l
			};
		} catch (e) {
			let { kind: t, resetAt: n } = Za(e);
			throw p(t, e, t === "quota" ? { resetAt: n } : {}), e;
		} finally {
			d && r.cancelFrame(d), a.msgPhase = null, a.stream = null;
		}
	}
	return {
		chat: a,
		conversation: Oo({
			chat: a,
			ask: m,
			setChatModel: s
		}),
		epochMs: r.epochMs,
		defaultChatModel: i,
		ensureReady: o.ensureReady,
		abortLoad: o.abortLoad,
		acceptDownload: o.accept,
		setKey: u,
		forgetKey: d,
		undoForgetKey: f,
		setChatModel: s,
		resetChatModel: c
	};
}
//#endregion
//#region node_modules/svelte/src/internal/disclose-version.js
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add("5");
//#endregion
//#region src/core/markdown.js
function zo(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Bo(e) {
	let t = e;
	return t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s*[\]]+)\)/g, "<a href=\"$2\" rel=\"noopener nofollow\" target=\"_blank\">$1</a>"), t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"), t = t.replace(/\[(\d{1,3})\](?!\()/g, "<sup class=\"cc-cite\">[$1]</sup>"), t;
}
function Vo(e) {
	return zo(e).split(/(`[^`\n]+`)/).map((e) => e.length > 2 && e.startsWith("`") && e.endsWith("`") ? `<code>${e.slice(1, -1)}</code>` : Bo(e)).join("");
}
function Ho(e, t) {
	let n = t ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/, r = e.map((e) => `<li>${Vo(e.replace(n, ""))}</li>`).join("");
	return t ? `<ol>${r}</ol>` : `<ul>${r}</ul>`;
}
function Uo(e, t) {
	if (typeof t != "string" || t.trim() === "") throw Error("renderMarkdown: codeLabel must be a non-empty string");
	if (typeof e != "string" || e.length === 0) return "";
	let n = `<pre class="cc-fence" tabindex="0" role="region" aria-label="${zo(t)}">`, r = e.replace(/\r\n?/g, "\n").split("\n"), i = [], a = [], o = () => {
		if (a.length === 0) return;
		let e = a.every((e) => /^\s*[-*]\s+/.test(e)), t = a.every((e) => /^\s*\d+[.)]\s+/.test(e));
		e ? i.push(Ho(a, !1)) : t ? i.push(Ho(a, !0)) : i.push(`<p>${a.map(Vo).join("<br>")}</p>`), a = [];
	};
	for (let e = 0; e < r.length; e++) {
		let t = r[e], s = t.match(/^```([\w+-]*)\s*$/);
		if (s) {
			o();
			let t = s[1], a = [];
			for (e++; e < r.length && !/^```\s*$/.test(r[e]);) a.push(r[e]), e++;
			let c = t ? ` class="language-${t}"` : "";
			i.push(`${n}<code${c}>${zo(a.join("\n"))}</code></pre>`);
		} else t.trim() === "" ? o() : a.push(t);
	}
	return o(), i.join("");
}
//#endregion
//#region src/ui/ChatMessage.svelte
var Wo = /* @__PURE__ */ q("<p class=\"cm-user\"><span class=\"cm-prompt\" aria-hidden=\"true\">❯</span> </p>"), Go = /* @__PURE__ */ q("<span class=\"cm-count\"> </span>"), Ko = /* @__PURE__ */ q("<button type=\"button\" class=\"cm-think-toggle\"><span class=\"cm-think-time\"> </span> <span class=\"cm-think-sep\" aria-hidden=\"true\">·</span> <span class=\"cm-think-act\"> </span></button>"), qo = /* @__PURE__ */ q("<span class=\"cm-think-label\"> </span>"), Jo = /* @__PURE__ */ q("<div class=\"cm-think\"><!> <div class=\"cm-think-clip\"><p class=\"cm-think-text\"> </p></div></div>"), Yo = /* @__PURE__ */ q("<div class=\"cm-body\"></div>"), Xo = /* @__PURE__ */ q("<span class=\"cm-src-corpus\"> </span>"), Zo = /* @__PURE__ */ q("<a class=\"cm-src\" target=\"_blank\" rel=\"noopener\"><span class=\"cm-src-n\"> </span> <!> <span class=\"cm-src-path\"> </span> <span class=\"cm-src-lines\"> </span> <span class=\"cm-src-pct\"> </span></a>"), Qo = /* @__PURE__ */ q("<details class=\"cm-sources\"><summary> </summary> <!></details>"), $o = /* @__PURE__ */ q("<article class=\"cm-card cm-print\"><header class=\"cm-head\"><span class=\"cm-title\"> </span> <!></header> <!> <!> <!></article>");
function es(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => t.live ? t.live.reasoningText : t.message?.reasoning ?? ""), r = /* @__PURE__ */ M(() => t.live ? t.live.answerText : t.message?.text ?? ""), i = /* @__PURE__ */ M(() => t.live ? t.live.reasoningMs : t.message?.reasoningMs ?? 0), a = /* @__PURE__ */ M(() => (G(i) / 1e3).toFixed(1)), o = /* @__PURE__ */ M(() => G(r).length > 0), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ M(() => G(s) ?? !G(o)), l = /* @__PURE__ */ P(null);
	mn(() => {
		G(n), t.live && G(l) && (G(l).scrollTop = G(l).scrollHeight);
	});
	var u = Sr(), d = rn(u), f = (e) => {
		var n = Wo(), r = z(R(n), 1, !0);
		k(n), B(() => Y(r, t.message.text)), J(e, n);
	}, p = (e) => {
		var i = $o(), u = R(i), d = R(u), f = R(d, !0);
		k(d);
		var p = z(d, 2), m = (e) => {
			var n = Go(), r = R(n);
			k(n), B(() => Y(r, `${t.message.sources.length ?? ""}
          ${(t.message.sources.length === 1 ? t.copy.sourcesOne : t.copy.sourcesMany) ?? ""}`)), J(e, n);
		};
		X(p, (e) => {
			t.message?.sources?.length && e(m);
		}), k(u);
		var h = z(u, 2), g = (e) => {
			var r = Jo(), i = R(r), u = (e) => {
				var n = Ko(), r = R(n), i = R(r);
				k(r);
				var o = z(r, 4), l = R(o, !0);
				k(o), k(n), B(() => {
					Z(n, "aria-expanded", G(c)), Y(i, `${t.copy.trace.reasonedPrefix ?? ""} ${G(a) ?? ""}s`), Y(l, G(c) ? t.copy.trace.hide : t.copy.trace.show);
				}), K("click", n, () => F(s, !G(c))), J(e, n);
			}, d = (e) => {
				var n = qo(), r = R(n, !0);
				k(n), B(() => Y(r, t.copy.trace.label)), J(e, n);
			};
			X(i, (e) => {
				G(o) ? e(u) : e(d, -1);
			});
			var f = z(i, 2), p = R(f), m = R(p, !0);
			k(p), oi(p, (e) => F(l, e), () => G(l)), k(f), k(r), B(() => {
				Z(r, "data-open", G(c)), Y(m, G(n));
			}), J(e, r);
		};
		X(h, (e) => {
			G(n) && e(g);
		});
		var _ = z(h, 2), v = (e) => {
			var n = Yo();
			Br(n, () => Uo(G(r), t.copy.codeLabel), !0), k(n), J(e, n);
		};
		X(_, (e) => {
			(G(r) || !t.live) && e(v);
		});
		var y = z(_, 2), b = (e) => {
			var n = Qo(), r = R(n), i = R(r, !0);
			k(r), Pr(z(r, 2), 17, () => t.message.sources, (e) => e.n, (e, n) => {
				var r = Zo(), i = R(r), a = R(i);
				k(i);
				var o = z(i, 2), s = (e) => {
					var t = Xo(), r = R(t, !0);
					k(t), B(() => Y(r, G(n).corpusId)), J(e, t);
				};
				X(o, (e) => {
					t.showCorpus && e(s);
				});
				var c = z(o, 2), l = R(c, !0);
				k(c);
				var u = z(c, 2), d = R(u);
				k(u);
				var f = z(u, 2), p = R(f);
				k(f), k(r), B((e) => {
					Z(r, "href", G(n).url), Y(a, `[${G(n).n ?? ""}]`), Y(l, G(n).path), Y(d, `L${G(n).startLine ?? ""}–${G(n).endLine ?? ""}`), Y(p, `${e ?? ""}%`);
				}, [() => Math.round(G(n).relevancePct)]), J(e, r);
			}), k(n), B(() => {
				n.open = t.sourcesOpen, Y(i, t.copy.sourcesHeading);
			}), J(e, n);
		};
		X(y, (e) => {
			t.message?.sources?.length && e(b);
		}), k(i), B(() => {
			Z(i, "data-streaming", t.live ? G(o) ? "writing" : "thinking" : void 0), Y(f, t.copy.answerTag);
		}), J(e, i);
	};
	X(d, (e) => {
		t.message?.role === "user" ? e(f) : e(p, -1);
	}), J(e, u), He();
}
fr(["click"]);
//#endregion
//#region src/ui/ConsentPanel.svelte
var ts = /* @__PURE__ */ q("<li class=\"cc-consent-corpus\"><span class=\"cc-consent-name\"> </span><span class=\"cc-consent-size\"> </span></li>"), ns = /* @__PURE__ */ q("<li class=\"cc-consent-engine\"><span class=\"cc-consent-name\"> </span><span class=\"cc-consent-size\"> </span></li>"), rs = /* @__PURE__ */ q("<div class=\"cc-panel cc-consent\" role=\"group\" tabindex=\"-1\"><p class=\"cc-load-title\"> </p> <p class=\"cc-consent-lead\"> </p> <ul class=\"cc-consent-list\"><!> <!></ul> <p class=\"cc-consent-total\"> </p> <div class=\"cc-consent-actions\"><button type=\"button\" class=\"cc-consent-accept\"> </button> <button type=\"button\" class=\"cc-consent-decline\"> </button></div></div>");
function is(e, t) {
	let n = Cr();
	Ve(t, !0);
	let r = /* @__PURE__ */ P(null), i = /* @__PURE__ */ M(() => no(t.consent.totalBytes, t.copy)), a = /* @__PURE__ */ M(() => no(t.consent.storedBytes, t.copy));
	mn(() => {
		G(r)?.focus();
	});
	var o = rs(), s = R(o), c = R(s, !0);
	k(s);
	var l = z(s, 2), u = R(l, !0);
	k(l);
	var d = z(l, 2), f = R(d);
	Pr(f, 17, () => t.consent.corpora, (e) => e.id, (e, n) => {
		var r = ts(), i = R(r), a = R(i, !0);
		k(i);
		var o = z(i), s = R(o, !0);
		k(o), k(r), B((e) => {
			Y(a, G(n).id), Y(s, e);
		}, [() => no(G(n).bytes, t.copy)]), J(e, r);
	});
	var p = z(f, 2), m = (e) => {
		var n = ns(), r = R(n), i = R(r, !0);
		k(r);
		var a = z(r), o = R(a, !0);
		k(a), k(n), B((e) => {
			Y(i, t.copy.consent.engine), Y(o, e);
		}, [() => no(t.consent.wasmBytes, t.copy)]), J(e, n);
	};
	X(p, (e) => {
		t.consent.wasmBytes && e(m);
	}), k(d);
	var h = z(d, 2), g = R(h, !0);
	k(h);
	var _ = z(h, 2), v = R(_), y = R(v, !0);
	k(v);
	var b = z(v, 2), x = R(b, !0);
	k(b), k(_), k(o), oi(o, (e) => F(r, e), () => G(r)), B((e, r) => {
		Z(o, "aria-labelledby", `${n}-title`), Z(o, "aria-describedby", `${n}-total`), Z(o, "data-total-bytes", t.consent.totalBytes), Z(s, "id", `${n}-title`), Y(c, t.copy.consent.title), Y(u, t.copy.consent.lead), Z(h, "id", `${n}-total`), Y(g, e), Y(y, r), Y(x, t.copy.consent.decline);
	}, [() => $(t.copy.consent.total, {
		download: G(i),
		stored: G(a)
	}), () => $(t.copy.consent.accept, { size: G(i) })]), K("click", v, function(...e) {
		t.onaccept?.apply(this, e);
	}), K("click", b, function(...e) {
		t.ondecline?.apply(this, e);
	}), J(e, o), He();
}
fr(["click"]);
//#endregion
//#region src/ui/ErrorCard.svelte
var as = /* @__PURE__ */ q("<p class=\"cc-error-reset\"> </p>"), os = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-error-paid\"> </button>"), ss = /* @__PURE__ */ q("<div class=\"cc-error\" role=\"alert\"><span class=\"cc-error-tag\"> </span> <p class=\"cc-error-body\"> </p> <!> <div class=\"cc-error-actions\"><!> <button type=\"button\" class=\"cc-error-retry\"> </button></div></div>");
function cs(e, t) {
	Ve(t, !0);
	var n = ss(), r = R(n), i = R(r, !0);
	k(r);
	var a = z(r, 2), o = R(a, !0);
	k(a);
	var s = z(a, 2), c = (e) => {
		var n = as(), r = R(n, !0);
		k(n), B(() => Y(r, t.resetText)), J(e, n);
	};
	X(s, (e) => {
		t.resetText && e(c);
	});
	var l = z(s, 2), u = R(l), d = (e) => {
		var n = os(), r = R(n, !0);
		k(n), B(() => Y(r, t.paidLabel)), K("click", n, function(...e) {
			t.onpaid?.apply(this, e);
		}), J(e, n);
	};
	X(u, (e) => {
		t.paidLabel && e(d);
	});
	var f = z(u, 2), p = R(f, !0);
	k(f), k(l), k(n), B(() => {
		Y(i, t.entry.tag), Y(o, t.detail ?? t.entry.body), Y(p, t.entry.retry);
	}), K("click", f, function(...e) {
		t.onretry?.apply(this, e);
	}), J(e, n), He();
}
fr(["click"]);
//#endregion
//#region src/ui/KeyRow.svelte
var ls = /* @__PURE__ */ q("<span class=\"cc-key-back\"><button type=\"button\" class=\"cc-key-keep\"> </button> <button type=\"button\" class=\"cc-key-forget\"> </button></span>"), us = /* @__PURE__ */ q("<p class=\"cc-key-forgotten\" role=\"status\"> <button type=\"button\" class=\"cc-key-undo\"> </button></p>"), ds = /* @__PURE__ */ q(" <a class=\"cc-link\" target=\"_blank\" rel=\"noopener\"> </a>", 1), fs = /* @__PURE__ */ q("<div class=\"cc-key\"><div class=\"cc-key-top\"><span class=\"cc-key-tag\"> </span> <!></div> <!> <p class=\"cc-key-lead\"><!></p> <form class=\"cc-key-form\"><input class=\"cc-key-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"button\" class=\"cc-key-toggle\"> </button> <button type=\"submit\" class=\"cc-key-save\"> </button></form></div>"), ps = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-model-reset\"> </button>"), ms = /* @__PURE__ */ q("<div class=\"cc-keyrow\"><span class=\"cc-connected\"><span class=\"cc-connected-dot\" aria-hidden=\"true\"></span> </span> <span class=\"cc-keyrow-note\"> </span> <button type=\"button\" class=\"cc-keyrow-swap\"> </button> <span class=\"cc-model\"><span class=\"cc-model-label\"> </span> <span class=\"cc-model-id\"> </span> <!></span></div>");
function hs(e, t) {
	Ve(t, !0);
	let n = si(t, "convo", 7), r = si(t, "swapping", 15), i = /* @__PURE__ */ M(() => t.session.chat), a = /* @__PURE__ */ P(!1), o = /* @__PURE__ */ P(null), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ P(null), l = /* @__PURE__ */ M(() => G(i).chatModel === t.session.defaultChatModel), u = /* @__PURE__ */ M(() => r() && G(i).keyState === "set"), d = /* @__PURE__ */ M(() => G(i).keyState === "missing" || G(u));
	mn(() => {
		G(u) && G(o)?.focus();
	});
	function f(e) {
		e.preventDefault();
		let i = n().keyDraft.trim();
		i && (t.session.setKey(i), n().keyDraft = "", F(a, !1), r(!1), t.onsaved());
	}
	async function p() {
		r(!1), n().keyDraft = "", F(a, !1), await tr(), G(s)?.focus();
	}
	async function m() {
		t.session.forgetKey(), r(!1), await tr(), G(c)?.focus();
	}
	async function h() {
		t.session.undoForgetKey(), await tr(), G(s)?.focus();
	}
	var g = Sr(), _ = rn(g), v = (e) => {
		var r = fs(), s = R(r), l = R(s), d = R(l, !0);
		k(l);
		var g = z(l, 2), _ = (e) => {
			var n = ls(), r = R(n), i = R(r, !0);
			k(r);
			var a = z(r, 2), o = R(a, !0);
			k(a), k(n), B(() => {
				Y(i, t.copy.key.keep), Y(o, t.copy.key.forget);
			}), K("click", r, p), K("click", a, m), J(e, n);
		};
		X(g, (e) => {
			G(u) && e(_);
		}), k(s);
		var v = z(s, 2), y = (e) => {
			var n = us(), r = R(n), i = z(r), a = R(i, !0);
			k(i), oi(i, (e) => F(c, e), () => G(c)), k(n), B(() => {
				Y(r, `${t.copy.key.forgotten ?? ""} `), Y(a, t.copy.key.undo);
			}), K("click", i, h), J(e, n);
		};
		X(v, (e) => {
			G(i).keyForgotten && !G(u) && e(y);
		});
		var b = z(v, 2), x = R(b), S = (e) => {
			var n = xr();
			B(() => Y(n, t.copy.key.swapLead)), J(e, n);
		}, ee = (e) => {
			var n = ds(), r = rn(n), i = z(r), a = R(i, !0);
			k(i), B(() => {
				Y(r, `${t.copy.key.lead ?? ""} `), Z(i, "href", t.copy.key.url), Y(a, t.copy.key.linkText);
			}), J(e, n);
		};
		X(x, (e) => {
			G(u) ? e(S) : e(ee, -1);
		}), k(b);
		var te = z(b, 2), C = R(te);
		Qr(C), oi(C, (e) => F(o, e), () => G(o));
		var w = z(C, 2), ne = R(w, !0);
		k(w);
		var re = z(w, 2), ie = R(re, !0);
		k(re), k(te), k(r), B((e) => {
			Z(r, "data-mode", G(u) ? "swap" : "new"), Y(d, G(u) ? t.copy.key.swapTag : t.copy.key.tag), Z(C, "type", G(a) ? "text" : "password"), Z(C, "placeholder", t.copy.key.placeholder), Z(C, "aria-label", t.copy.key.inputLabel), Z(w, "aria-pressed", G(a)), Y(ne, G(a) ? t.copy.key.conceal : t.copy.key.reveal), re.disabled = e, Y(ie, t.copy.key.save);
		}, [() => !n().keyDraft.trim()]), dr("submit", te, f), ni(C, () => n().keyDraft, (e) => n().keyDraft = e), K("click", w, () => F(a, !G(a))), J(e, r);
	}, y = (e) => {
		var n = ms(), a = R(n), o = z(R(a), 1, !0);
		k(a);
		var c = z(a, 2), u = R(c, !0);
		k(c);
		var d = z(c, 2), f = R(d, !0);
		k(d), oi(d, (e) => F(s, e), () => G(s));
		var p = z(d, 2), m = R(p), h = R(m, !0);
		k(m);
		var g = z(m, 2), _ = R(g, !0);
		k(g);
		var v = z(g, 2), y = (e) => {
			var n = ps(), r = R(n, !0);
			k(n), B(() => Y(r, t.copy.model.reset)), K("click", n, () => t.session.resetChatModel()), J(e, n);
		};
		X(v, (e) => {
			G(l) || e(y);
		}), k(p), k(n), B(() => {
			Y(o, t.copy.key.connectedTag), Y(u, t.copy.key.connectedNote), Y(f, t.copy.key.change), Z(p, "title", G(i).chatModel), Y(h, t.copy.model.label), Y(_, G(i).chatModel);
		}), K("click", d, () => r(!0)), J(e, n);
	};
	X(_, (e) => {
		G(d) ? e(v) : e(y, -1);
	}), J(e, g), He();
}
fr(["click"]);
//#endregion
//#region src/ui/LatticeIcon.svelte
var gs = /* @__PURE__ */ br("<svg class=\"cc-icon\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.5 7.5 12 4M4.5 7.5 12 12M4.5 7.5 12 20M4.5 16.5 12 4M4.5 16.5 12 12M4.5 16.5 12 20M12 4 19.5 7.5M12 12 19.5 7.5M12 20 19.5 7.5M12 4 19.5 16.5M12 12 19.5 16.5M12 20 19.5 16.5\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\"0.6\"></path><g fill=\"currentColor\"><circle cx=\"4.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"4.5\" cy=\"16.5\" r=\"2\"></circle><circle cx=\"12\" cy=\"4\" r=\"2\"></circle><circle cx=\"12\" cy=\"12\" r=\"2\"></circle><circle cx=\"12\" cy=\"20\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"16.5\" r=\"2\"></circle></g></svg>");
function _s(e, t) {
	var n = gs();
	B(() => {
		Z(n, "width", t.size), Z(n, "height", t.size);
	}), J(e, n);
}
//#endregion
//#region src/core/status.js
var vs = Object.freeze([
	"wasm-init",
	"manifest",
	"loading-cached",
	"downloading",
	"caching",
	"indexing"
]), ys = [
	"manifest",
	"wasm-init",
	"corpus",
	"indexing"
], bs = (e) => (e / 1e6).toFixed(1), xs = (e) => String(e).slice(0, 7);
function Ss(e, t) {
	return $(e.progress.bytes, {
		loaded: bs(t.loadedBytes),
		total: bs(t.totalBytes)
	});
}
function Cs(e, t) {
	return $(e.progress.count, {
		done: t.indexed,
		total: t.totalPoints
	});
}
function ws(e, t, n) {
	if (n) return t.phase[e.msgPhase] ?? t.phase.writing;
	if (e.status === "ready" && e.corpora.length > 0) {
		let n = e.corpora.reduce((e, t) => e + t.chunks, 0), r = e.corpora.length === 1 ? xs(e.corpora[0].commit) : $(t.pill.corpora, { n: e.corpora.length }), i = [
			t.status.ready,
			r,
			$(t.pill.chunks, { n }),
			$(t.pill.dim, { n: e.corpora[0].dim })
		];
		return e.offline && i.push(t.offlineBadge), i.join(" · ");
	}
	return e.status === "downloading" && e.progress.totalBytes > 0 ? `${t.status.downloading} ${Ss(t, e.progress)}` : e.status === "indexing" && e.progress.totalPoints > 0 ? `${t.status.indexing} ${Cs(t, e.progress)}` : t.status[e.status] ?? e.status;
}
function Ts(e, t, n) {
	return n || e.status === "ready" ? ws(e, t, n) : t.status[e.status] ?? e.status;
}
function Es(e, t) {
	return e.status === "error" ? "error" : e.status === "consent" ? "idle" : e.status === "ready" ? t ? "working" : "ready" : e.status === "idle" ? "idle" : "working";
}
function Ds(e, t) {
	let n = e.progress;
	return e.status === "downloading" || e.status === "caching" ? n.totalBytes > 0 ? Ss(t, n) : "" : (e.status === "indexing" || e.status === "loading-cached") && n.totalPoints > 0 ? Cs(t, n) : "";
}
function Os(e, t) {
	let n = [
		"loading-cached",
		"downloading",
		"caching"
	].includes(e.status) ? "corpus" : e.status, r = ys.indexOf(n);
	return ys.map((n, i) => ({
		id: n,
		label: t.loader.stages[n],
		state: r === -1 ? "pending" : i < r ? "done" : i === r ? "active" : "pending",
		detail: i === r ? Ds(e, t) : ""
	}));
}
function ks(e) {
	let t = e.progress;
	return (e.status === "downloading" || e.status === "caching") && t.totalBytes > 0 ? Math.min(100, t.loadedBytes / t.totalBytes * 100) : (e.status === "indexing" || e.status === "loading-cached") && t.totalPoints > 0 ? Math.min(100, t.indexed / t.totalPoints * 100) : null;
}
//#endregion
//#region src/ui/LoaderPanel.svelte
var As = /* @__PURE__ */ q("<div><dt> </dt> <dd> </dd></div>"), js = /* @__PURE__ */ q("<dl class=\"cc-load-meta\"><div><dt> </dt> <dd> </dd></div> <!></dl>"), Ms = /* @__PURE__ */ q("<span class=\"cc-stage-detail\"> </span>"), Ns = /* @__PURE__ */ q("<li class=\"cc-stage\"><span class=\"cc-stage-glyph\" aria-hidden=\"true\"> </span> <span class=\"cc-stage-label\"> </span> <!></li>"), Ps = /* @__PURE__ */ q("<p class=\"cc-offline\"> </p>"), Fs = /* @__PURE__ */ q("<div class=\"cc-panel cc-load\" aria-busy=\"true\"><p class=\"cc-load-title\"> </p> <!> <ol class=\"cc-stages\"></ol> <div class=\"cc-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\"><div></div></div> <!> <p class=\"cc-fine\"> </p></div>");
function Is(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => Os(t.chat, t.copy)), r = /* @__PURE__ */ M(() => ks(t.chat));
	var i = Fs(), a = R(i), o = R(a, !0);
	k(a);
	var s = z(a, 2), c = (e) => {
		var n = js(), r = R(n), i = R(r), a = R(i, !0);
		k(i);
		var o = z(i, 2), s = R(o, !0);
		k(o), k(r);
		var c = z(r, 2), l = (e) => {
			var n = As(), r = R(n), i = R(r, !0);
			k(r);
			var a = z(r, 2), o = R(a, !0);
			k(a), k(n), B(() => {
				Y(i, t.copy.loader.chunksLabel), Y(o, t.chat.progress.totalPoints);
			}), J(e, n);
		};
		X(c, (e) => {
			t.chat.progress.totalPoints > 0 && e(l);
		}), k(n), B((e) => {
			Y(a, t.copy.loader.sizeLabel), Y(s, e);
		}, [() => $(t.copy.progress.size, { total: bs(t.chat.progress.totalBytes) })]), J(e, n);
	};
	X(s, (e) => {
		t.chat.progress.totalBytes > 0 && e(c);
	});
	var l = z(s, 2);
	Pr(l, 21, () => G(n), (e) => e.id, (e, t) => {
		var n = Ns(), r = R(n), i = R(r, !0);
		k(r);
		var a = z(r, 2), o = R(a, !0);
		k(a);
		var s = z(a, 2), c = (e) => {
			var n = Ms(), r = R(n, !0);
			k(n), B(() => Y(r, G(t).detail)), J(e, n);
		};
		X(s, (e) => {
			G(t).detail && e(c);
		}), k(n), B(() => {
			Z(n, "data-state", G(t).state), Y(i, G(t).state === "done" ? "✓" : G(t).state === "active" ? "●" : "○"), Y(o, G(t).label);
		}), J(e, n);
	}), k(l);
	var u = z(l, 2), d = R(u);
	let f, p;
	k(u);
	var m = z(u, 2), h = (e) => {
		var n = Ps(), r = R(n, !0);
		k(n), B(() => Y(r, t.copy.offlineBadge)), J(e, n);
	};
	X(m, (e) => {
		t.chat.offline && e(h);
	});
	var g = z(m, 2), _ = R(g, !0);
	k(g), k(i), B((e) => {
		Y(o, t.copy.loader.title), Z(u, "aria-label", t.copy.loader.title), Z(u, "aria-valuenow", e), f = Kr(d, 1, "cc-bar-fill", null, f, { "cc-shimmer": G(r) === null }), p = Jr(d, "", p, { width: `${(G(r) === null ? 100 : G(r)) ?? ""}%` }), Y(_, t.copy.loader.cancelNote);
	}, [() => G(r) === null ? void 0 : Math.round(G(r))]), J(e, i), He();
}
//#endregion
//#region src/ui/focus-trap.js
var Ls = "a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])";
function Rs(e) {
	return [...e.querySelectorAll(Ls)].filter((e) => e.offsetParent !== null);
}
function zs(e, t) {
	if (e.key !== "Tab" || e.ctrlKey || e.metaKey) return !1;
	let n = Rs(t);
	if (n.length === 0) return !1;
	let r = document.activeElement, i = (e) => !!(r && r !== e && r.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING), a = (e) => !!(r && r !== e && e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING && !e.contains(r)), o = r && t.contains(r), s;
	return e.shiftKey ? (s = o ? n.findLast(a) : void 0, s ??= n[n.length - 1]) : (s = o ? n.find(i) : void 0, s ??= n[0]), e.preventDefault(), s.focus(), !0;
}
//#endregion
//#region src/core/reset-time.js
function Bs(e, t, n, { locale: r, timeZone: i }) {
	let a = new Date(e).toLocaleTimeString(r, {
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
		timeZone: i
	}), o = Math.ceil((e - t) / 6e4);
	if (o <= 0) return `${n.errors.quota.reset} ${a}.`;
	let s = $(n.errors.quota.resetIn, {
		h: Math.floor(o / 60),
		m: o % 60
	});
	return `${n.errors.quota.reset} ${a}, ${s}.`;
}
//#endregion
//#region src/ui/RepoChat.svelte
var Vs = /* @__PURE__ */ q("<div class=\"cc-motif\" aria-hidden=\"true\"></div>"), Hs = /* @__PURE__ */ q("<div class=\"cc-panel\"><!></div>"), Us = /* @__PURE__ */ q("<p class=\"cc-offline\"> </p>"), Ws = /* @__PURE__ */ q("<p class=\"cc-cleared\" role=\"status\"> <button type=\"button\" class=\"cc-undo\"> </button></p>"), Gs = /* @__PURE__ */ q("<p class=\"cc-boot-line\"> </p>"), Ks = /* @__PURE__ */ q("<p class=\"cc-boot-line cc-boot-corpus\"> </p>"), qs = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-chip\"> </button>"), Js = /* @__PURE__ */ q("<!> <p class=\"cc-sub\"> </p> <div class=\"cc-boot\"><!> <!></div> <div class=\"cc-chips\"></div>", 1), Ys = /* @__PURE__ */ q("<p class=\"cc-pending\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-pending-bar cc-shimmer\" aria-hidden=\"true\"></span></p>"), Xs = /* @__PURE__ */ q("<div class=\"cc-log\" role=\"log\" aria-live=\"polite\" tabindex=\"-1\"><!> <!> <!> <!> <!></div>"), Zs = /* @__PURE__ */ q("<button type=\"button\" class=\"cc-clear\"> </button>"), Qs = /* @__PURE__ */ q("<div class=\"cc-backdrop\" role=\"presentation\"><div class=\"cc\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\"><!> <header class=\"cc-head\"><div class=\"cc-head-titles\"><span class=\"cc-slabel\"><!> </span> <h2 class=\"cc-title\"> </h2></div> <p class=\"cc-status\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-status-text\"> </span></p> <p class=\"cc-sr\" role=\"status\"> </p> <button type=\"button\" class=\"cc-close\">✕</button></header> <!> <!> <form class=\"cc-input-row\"><span class=\"cc-prompt\" aria-hidden=\"true\">❯</span> <input class=\"cc-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"submit\" class=\"cc-ask\"> </button></form> <div class=\"cc-foot\"><!> <span class=\"cc-hint\" aria-live=\"polite\"><!></span> <span class=\"cc-fineprint\"> </span></div></div></div>");
function $s(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => t.session.chat), r = /* @__PURE__ */ M(() => t.session.conversation), i = /* @__PURE__ */ M(() => G(r).convo), a = /* @__PURE__ */ P(null), o = /* @__PURE__ */ P(null), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ P(!1), l = /* @__PURE__ */ M(() => vs.includes(G(n).status) || G(n).status === "idle"), u = /* @__PURE__ */ M(() => G(n).status === "ready"), d = /* @__PURE__ */ M(() => G(n).status === "error" ? G(n).error : null), f = /* @__PURE__ */ M(() => G(n).status === "consent" ? G(n).consent : null), p = /* @__PURE__ */ M(() => G(r).canAsk()), m = /* @__PURE__ */ M(() => ws(G(n), t.copy, G(i).asking)), h = /* @__PURE__ */ M(() => Ts(G(n), t.copy, G(i).asking)), g = /* @__PURE__ */ M(() => Es(G(n), G(i).asking)), _ = /* @__PURE__ */ M(() => G(i).askError), v = /* @__PURE__ */ M(() => G(_)?.kind === "quota" && G(_).resetAt ? Bs(G(_).resetAt, t.session.epochMs(), t.copy, {
		locale: [],
		timeZone: void 0
	}) : ""), y = /* @__PURE__ */ M(() => G(n).chatModel.endsWith(":free") ? G(n).chatModel.slice(0, -5) : ""), b = /* @__PURE__ */ M(() => G(i).asking && G(n).stream && (G(n).stream.reasoningText || G(n).stream.answerText) ? G(n).stream : null), x = /* @__PURE__ */ M(() => G(b) ? [...G(i).messages, {
		id: G(i).nextId,
		role: "assistant",
		live: G(b)
	}] : G(i).messages), S = /* @__PURE__ */ M(() => G(d) ? t.copy.errors[G(d).kind] ?? t.copy.errors.generic : null);
	mn(() => {
		let e = document.activeElement;
		document.body.style.overflow = "hidden", G(a)?.focus(), ir(() => t.session.ensureReady());
		let n = (e) => {
			G(a) && e.target instanceof Node && !G(a).contains(e.target) && G(a).focus();
		};
		return document.addEventListener("focusin", n), () => {
			document.removeEventListener("focusin", n), document.body.style.overflow = "", e instanceof HTMLElement && e.focus();
		};
	}), mn(() => {
		G(n).status === "ready" && t.onready();
	}), mn(() => {
		G(i).messages.length, G(i).asking, G(n).msgPhase, G(n).stream?.reasoningText, G(n).stream?.answerText, G(s) && (!G(b) && !G(i).asking && !t.reducedMotion() ? G(s).scrollTo({
			top: G(s).scrollHeight,
			behavior: "smooth"
		}) : G(s).scrollTop = G(s).scrollHeight);
	});
	function ee() {
		(vs.includes(G(n).status) || G(n).status === "consent") && t.session.abortLoad(), t.onclose();
	}
	async function te() {
		t.session.acceptDownload(), await tr(), G(a)?.focus();
	}
	function C(e) {
		e.key === "Escape" ? ee() : G(a) && zs(e, G(a));
	}
	async function w(e) {
		await tr(), e?.detail === 0 ? G(o)?.focus() : G(s)?.focus({ preventScroll: !0 });
	}
	let ne = null;
	function re(e) {
		e.preventDefault();
		let t = e.submitter && document.activeElement === e.submitter;
		G(r).submit() && t && w(ne);
	}
	function ie(e, t) {
		G(p) ? G(r).submit(e) && w(t) : G(i).draft = e;
	}
	function ae(e) {
		G(_)?.kind === "key" ? (G(r).dismissError(), F(c, !0)) : (G(r).retry(), w(e));
	}
	function oe(e) {
		G(y) && (G(r).retryOnModel(G(y)), w(e));
	}
	async function se() {
		G(r).clear(), await tr(), G(o)?.focus();
	}
	async function ce() {
		G(r).undoClear(), await tr(), G(o)?.focus();
	}
	async function le() {
		t.session.ensureReady(), await tr(), G(a)?.focus();
	}
	var ue = Qs();
	dr("keydown", Zt, C);
	var de = R(ue), fe = R(de), pe = (e) => {
		var n = Vs();
		Br(n, () => t.brand.motifSvg, !0), k(n), J(e, n);
	};
	X(fe, (e) => {
		t.brand.motifSvg && e(pe);
	});
	var me = z(fe, 2), he = R(me), ge = R(he), _e = R(ge);
	_s(_e, { size: 14 });
	var ve = z(_e, 1, !0);
	k(ge);
	var ye = z(ge, 2), be = R(ye, !0);
	k(ye), k(he);
	var xe = z(he, 2), Se = z(R(xe), 2), Ce = R(Se, !0);
	k(Se), k(xe);
	var we = z(xe, 2), Te = R(we, !0);
	k(we);
	var T = z(we, 2);
	k(me);
	var Ee = z(me, 2), De = (e) => {
		var t = Hs(), n = R(t);
		{
			let e = /* @__PURE__ */ M(() => G(d).kind === "config" ? G(d).message : null);
			cs(n, {
				get entry() {
					return G(S);
				},
				get detail() {
					return G(e);
				},
				resetText: "",
				paidLabel: "",
				onpaid: () => {},
				onretry: le
			});
		}
		k(t), J(e, t);
	}, Oe = (e) => {
		is(e, {
			get consent() {
				return G(f);
			},
			get copy() {
				return t.copy;
			},
			onaccept: te,
			ondecline: ee
		});
	}, ke = (e) => {
		Is(e, {
			get chat() {
				return G(n);
			},
			get copy() {
				return t.copy;
			}
		});
	}, Ae = (e) => {
		var r = Xs(), a = R(r), o = (e) => {
			var n = Us(), r = R(n, !0);
			k(n), B(() => Y(r, t.copy.offlineBadge)), J(e, n);
		};
		X(a, (e) => {
			G(n).offline && e(o);
		});
		var c = z(a, 2), l = (e) => {
			var r = Js(), a = rn(r), o = (e) => {
				var n = Ws(), r = R(n), i = z(r), a = R(i, !0);
				k(i), k(n), B(() => {
					Y(r, `${t.copy.conversation.cleared ?? ""} `), Y(a, t.copy.conversation.undo);
				}), K("click", i, ce), J(e, n);
			};
			X(a, (e) => {
				G(i).cleared && e(o);
			});
			var s = z(a, 2), c = R(s, !0);
			k(s);
			var l = z(s, 2), u = R(l);
			Pr(u, 17, () => t.copy.boot, Ar, (e, t) => {
				var n = Gs(), r = R(n, !0);
				k(n), B(() => Y(r, G(t))), J(e, n);
			}), Pr(z(u, 2), 17, () => G(n).corpora, (e) => e.id, (e, n) => {
				var r = Ks(), i = R(r, !0);
				k(r), B((e) => Y(i, e), [() => $(t.copy.corpusLine, {
					id: G(n).id,
					chunks: G(n).chunks,
					files: G(n).files,
					commit: xs(G(n).commit)
				})]), J(e, r);
			}), k(l);
			var d = z(l, 2);
			Pr(d, 21, () => t.copy.starters, Ar, (e, t) => {
				var n = qs(), r = R(n, !0);
				k(n), B(() => Y(r, G(t))), K("click", n, (e) => ie(G(t), e)), J(e, n);
			}), k(d), B(() => Y(c, t.copy.sub)), J(e, r);
		};
		X(c, (e) => {
			G(i).messages.length === 0 && e(l);
		});
		var u = z(c, 2);
		Pr(u, 17, () => G(x), (e) => e.id, (e, r) => {
			{
				let i = /* @__PURE__ */ M(() => G(r).live ? null : G(r)), a = /* @__PURE__ */ M(() => G(r).live ?? null), o = /* @__PURE__ */ M(() => G(n).corpora.length > 1);
				es(e, {
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
		var d = z(u, 2), f = (e) => {
			var r = Ys(), i = z(R(r));
			Pe(), k(r), B(() => Y(i, ` ${t.copy.phase[G(n).msgPhase] ?? t.copy.phase.writing ?? ""} `)), J(e, r);
		};
		X(d, (e) => {
			!G(b) && G(i).asking && e(f);
		});
		var p = z(d, 2), m = (e) => {
			{
				let n = /* @__PURE__ */ M(() => G(_).kind === "quota" && G(y) ? t.copy.errors.quota.paid : "");
				cs(e, {
					get entry() {
						return t.copy.errors[G(_).kind];
					},
					get detail() {
						return G(_).detail;
					},
					get resetText() {
						return G(v);
					},
					get paidLabel() {
						return G(n);
					},
					onpaid: oe,
					onretry: ae
				});
			}
		};
		X(p, (e) => {
			G(_) && e(m);
		}), k(r), oi(r, (e) => F(s, e), () => G(s)), B(() => {
			Z(r, "aria-label", t.copy.conversation.label), Z(r, "aria-busy", G(i).asking);
		}), J(e, r);
	};
	X(Ee, (e) => {
		G(d) ? e(De) : G(f) ? e(Oe, 1) : G(l) ? e(ke, 2) : e(Ae, -1);
	});
	var je = z(Ee, 2);
	hs(je, {
		get session() {
			return t.session;
		},
		get copy() {
			return t.copy;
		},
		get convo() {
			return G(i);
		},
		onsaved: () => G(o)?.focus(),
		get swapping() {
			return G(c);
		},
		set swapping(e) {
			F(c, e, !0);
		}
	});
	var E = z(je, 2), Me = z(R(E), 2);
	Qr(Me), oi(Me, (e) => F(o, e), () => G(o));
	var D = z(Me, 2), O = R(D, !0);
	k(D), k(E);
	var Ne = z(E, 2), Fe = R(Ne), Ie = (e) => {
		var n = Zs(), r = R(n, !0);
		k(n), B(() => Y(r, t.copy.conversation.clear)), K("click", n, se), J(e, n);
	};
	X(Fe, (e) => {
		G(i).messages.length > 0 && !G(i).asking && e(Ie);
	});
	var Le = z(Fe, 2), Re = R(Le), ze = (e) => {
		var n = xr();
		B(() => Y(n, t.copy.input.hintLoading)), J(e, n);
	}, A = (e) => {
		var n = xr();
		B(() => Y(n, t.copy.input.hintNoKey)), J(e, n);
	};
	X(Re, (e) => {
		!G(u) && !G(d) && !G(f) ? e(ze) : G(n).keyState === "missing" && e(A, 1);
	}), k(Le);
	var Be = z(Le, 2), Ue = R(Be, !0);
	k(Be), k(Ne), k(de), oi(de, (e) => F(a, e), () => G(a)), k(ue), B((e) => {
		Z(de, "aria-label", t.copy.navLabel), Y(ve, t.copy.label), Y(be, t.copy.title), Z(xe, "data-tone", G(g)), Z(xe, "title", G(m)), Y(Ce, G(m)), Y(Te, G(h)), Z(T, "aria-label", t.copy.closeLabel), Z(Me, "placeholder", t.copy.input.placeholder), Z(Me, "aria-label", t.copy.navLabel), Me.disabled = !G(u), D.disabled = e, Y(O, t.copy.input.ask), Y(Ue, t.copy.input.fine);
	}, [() => !G(p) || !G(i).draft.trim()]), K("click", ue, ee), K("click", de, (e) => e.stopPropagation()), K("click", T, ee), dr("submit", E, re), ni(Me, () => G(i).draft, (e) => G(i).draft = e), K("click", D, (e) => ne = e), J(e, ue), He();
}
fr(["click"]);
//#endregion
//#region src/core/search-status.js
function ec(e, t) {
	if (e.searching) return t.search.searching;
	if (e.status !== "ready" || e.corpora.length === 0) return ws(e, t, !1);
	let n = e.corpora.reduce((e, t) => e + t.chunks, 0), r = e.corpora.length === 1 ? xs(e.corpora[0].commit) : $(t.pill.corpora, { n: e.corpora.length }), i = [...new Set(e.corpora.map((e) => t.search.plan[e.plan.kind]))].join(" + "), a = [
		t.status.ready,
		r,
		$(t.pill.chunks, { n }),
		i
	];
	return e.offline && a.push(t.offlineBadge), a.join(" · ");
}
function tc(e, t) {
	return e.searching || e.status === "ready" ? ec(e, t) : t.status[e.status] ?? e.status;
}
function nc(e, t) {
	let n = e.items.length;
	return n === 0 ? $(t.search.empty, { query: e.query }) : n === 1 ? $(t.search.countOne, { query: e.query }) : $(t.search.count, {
		n,
		query: e.query
	});
}
//#endregion
//#region src/ui/SearchResults.svelte
var rc = /* @__PURE__ */ q("<a class=\"cs-hit-title\"> </a>"), ic = /* @__PURE__ */ q("<span class=\"cs-hit-title\"> </span>"), ac = /* @__PURE__ */ q("<span class=\"cs-crumb-sep\" aria-hidden=\"true\">›</span>"), oc = /* @__PURE__ */ q("<!><span class=\"cs-crumb\"> </span>", 1), sc = /* @__PURE__ */ q("<p class=\"cs-crumbs\"><span class=\"cc-sr\"> </span> <!></p>"), cc = /* @__PURE__ */ q("<mark> </mark>"), lc = /* @__PURE__ */ q("<p class=\"cs-snippet\"></p>"), uc = /* @__PURE__ */ q("<span class=\"cs-corpus\"> </span>"), dc = /* @__PURE__ */ q("<li class=\"cs-hit\"><!> <!> <!> <!></li>"), fc = /* @__PURE__ */ q("<ol class=\"cs-results\"></ol>"), pc = /* @__PURE__ */ q("<p class=\"cs-count\" role=\"status\"> </p> <!>", 1);
function mc(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ P(null), r = /* @__PURE__ */ M(() => nc(t.results, t.copy)), i = () => G(n) ? [...G(n).querySelectorAll("a.cs-hit-title")] : [];
	function a() {
		let e = i()[0];
		return e?.focus(), !!e;
	}
	function o(e) {
		let n = i(), r = n.indexOf(document.activeElement);
		if (r === -1) return;
		let a = null;
		if (e.key === "ArrowDown") a = n[Math.min(r + 1, n.length - 1)];
		else if (e.key === "ArrowUp") a = r === 0 ? null : n[r - 1];
		else if (e.key === "Home") a = n[0];
		else if (e.key === "End") a = n[n.length - 1];
		else return;
		e.preventDefault(), a ? a.focus() : t.onexitup();
	}
	function s(e) {
		e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || t.onpick();
	}
	var c = { focusFirst: a }, l = pc(), u = rn(l), d = R(u, !0);
	k(u);
	var f = z(u, 2), p = (e) => {
		var r = fc();
		Pr(r, 21, () => t.results.items, (e) => e.key, (e, n) => {
			var r = dc(), i = R(r), a = (e) => {
				var t = rc(), r = R(t, !0);
				k(t), B(() => {
					Z(t, "href", G(n).url), Y(r, G(n).title);
				}), K("click", t, s), J(e, t);
			}, o = (e) => {
				var t = ic(), r = R(t, !0);
				k(t), B(() => Y(r, G(n).title)), J(e, t);
			};
			X(i, (e) => {
				G(n).url ? e(a) : e(o, -1);
			});
			var c = z(i, 2), l = (e) => {
				var r = sc(), i = R(r), a = R(i);
				k(i), Pr(z(i, 2), 17, () => G(n).crumbs, Ar, (e, t, n) => {
					var r = oc(), i = rn(r), a = (e) => {
						J(e, ac());
					};
					X(i, (e) => {
						n > 0 && e(a);
					});
					var o = z(i), s = R(o, !0);
					k(o), B(() => Y(s, G(t))), J(e, r);
				}), k(r), B(() => Y(a, `${t.copy.search.crumbsLabel ?? ""}:`)), J(e, r);
			};
			X(c, (e) => {
				G(n).crumbs.length > 0 && e(l);
			});
			var u = z(c, 2), d = (e) => {
				var t = lc();
				Pr(t, 21, () => G(n).snippet, Ar, (e, t) => {
					var n = Sr(), r = rn(n), i = (e) => {
						var n = cc(), r = R(n, !0);
						k(n), B(() => Y(r, G(t).text)), J(e, n);
					}, a = (e) => {
						var n = xr();
						B(() => Y(n, G(t).text)), J(e, n);
					};
					X(r, (e) => {
						G(t).hit ? e(i) : e(a, -1);
					}), J(e, n);
				}), k(t), J(e, t);
			};
			X(u, (e) => {
				G(n).snippet.length > 0 && e(d);
			});
			var f = z(u, 2), p = (e) => {
				var t = uc(), r = R(t, !0);
				k(t), B(() => Y(r, G(n).corpusId)), J(e, t);
			};
			X(f, (e) => {
				t.showCorpus && e(p);
			}), k(r), J(e, r);
		}), k(r), oi(r, (e) => F(n, e), () => G(n)), B(() => Z(r, "aria-label", t.copy.search.resultsLabel)), K("keydown", r, o), J(e, r);
	};
	return X(f, (e) => {
		t.results.items.length > 0 && e(p);
	}), B(() => Y(d, G(r))), J(e, l), He(c);
}
fr(["keydown", "click"]);
//#endregion
//#region src/ui/RepoSearch.svelte
var hc = /* @__PURE__ */ q("<div class=\"cc-motif\" aria-hidden=\"true\"></div>"), gc = /* @__PURE__ */ q("<div class=\"cc-panel\"><!></div>"), _c = /* @__PURE__ */ q("<p class=\"cc-offline\"> </p>"), vc = /* @__PURE__ */ q("<p class=\"cc-sub\"> </p>"), yc = /* @__PURE__ */ q("<div class=\"cc-log cs-log\"><!> <!> <!></div>"), bc = /* @__PURE__ */ q("<div class=\"cc-backdrop\" role=\"presentation\"><div class=\"cc cs\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\"><!> <header class=\"cc-head\"><div class=\"cc-head-titles\"><span class=\"cc-slabel\"><!> </span> <h2 class=\"cc-title\"> </h2></div> <p class=\"cc-status\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-status-text\"> </span></p> <p class=\"cc-sr\" role=\"status\"> </p> <button type=\"button\" class=\"cc-close\">✕</button></header> <!> <form class=\"cc-input-row\" role=\"search\"><span class=\"cc-prompt\" aria-hidden=\"true\">❯</span> <input class=\"cc-input cs-input\" type=\"search\" autocomplete=\"off\" spellcheck=\"false\" enterkeyhint=\"search\"/> <button type=\"submit\" class=\"cc-ask cs-submit\"> </button></form> <div class=\"cc-foot\"><span class=\"cc-hint\" aria-live=\"polite\"><!></span> <span class=\"cc-fineprint\"> </span></div></div></div>");
function xc(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => t.session.chat), r = /* @__PURE__ */ P(null), i = /* @__PURE__ */ P(null), a = /* @__PURE__ */ P(null), o = /* @__PURE__ */ M(() => vs.includes(G(n).status) || G(n).status === "idle"), s = /* @__PURE__ */ M(() => G(n).status === "ready"), c = /* @__PURE__ */ M(() => G(n).status === "error" ? G(n).error : null), l = /* @__PURE__ */ M(() => G(n).status === "consent" ? G(n).consent : null), u = /* @__PURE__ */ M(() => ec(G(n), t.copy)), d = /* @__PURE__ */ M(() => tc(G(n), t.copy)), f = /* @__PURE__ */ M(() => Es(G(n), G(n).searching)), p = /* @__PURE__ */ M(() => G(c) ? t.copy.errors[G(c).kind] ?? t.copy.errors.generic : null);
	mn(() => {
		let e = document.activeElement;
		document.body.style.overflow = "hidden", G(r)?.focus(), ir(() => t.session.ensureReady());
		let n = (e) => {
			G(r) && e.target instanceof Node && !G(r).contains(e.target) && G(r).focus();
		};
		return document.addEventListener("focusin", n), () => {
			document.removeEventListener("focusin", n), document.body.style.overflow = "", e instanceof HTMLElement && e.focus();
		};
	}), mn(() => {
		G(n).status === "ready" && (t.onready(), ir(() => tr().then(() => G(i)?.focus())));
	});
	function m() {
		(vs.includes(G(n).status) || G(n).status === "consent") && t.session.abortLoad(), t.onclose();
	}
	async function h() {
		t.session.acceptDownload(), await tr(), G(r)?.focus();
	}
	function g(e) {
		e.key === "Escape" ? m() : G(r) && zs(e, G(r));
	}
	function _(e) {
		e.preventDefault(), t.session.search(G(n).draft);
	}
	function v(e) {
		e.key === "ArrowDown" && G(a)?.focusFirst() && e.preventDefault();
	}
	async function y() {
		t.session.ensureReady(), await tr(), G(r)?.focus();
	}
	async function b() {
		await t.session.search(G(n).draft || G(n).results?.query || ""), G(i)?.focus();
	}
	var x = bc();
	dr("keydown", Zt, g);
	var S = R(x), ee = R(S), te = (e) => {
		var n = hc();
		Br(n, () => t.brand.motifSvg, !0), k(n), J(e, n);
	};
	X(ee, (e) => {
		t.brand.motifSvg && e(te);
	});
	var C = z(ee, 2), w = R(C), ne = R(w), re = R(ne);
	_s(re, { size: 14 });
	var ie = z(re, 1, !0);
	k(ne);
	var ae = z(ne, 2), oe = R(ae, !0);
	k(ae), k(w);
	var se = z(w, 2), ce = z(R(se), 2), le = R(ce, !0);
	k(ce), k(se);
	var ue = z(se, 2), de = R(ue, !0);
	k(ue);
	var fe = z(ue, 2);
	k(C);
	var pe = z(C, 2), me = (e) => {
		var t = gc(), n = R(t);
		{
			let e = /* @__PURE__ */ M(() => G(c).kind === "config" ? G(c).message : null);
			cs(n, {
				get entry() {
					return G(p);
				},
				get detail() {
					return G(e);
				},
				resetText: "",
				paidLabel: "",
				onpaid: () => {},
				onretry: y
			});
		}
		k(t), J(e, t);
	}, he = (e) => {
		is(e, {
			get consent() {
				return G(l);
			},
			get copy() {
				return t.copy;
			},
			onaccept: h,
			ondecline: m
		});
	}, ge = (e) => {
		Is(e, {
			get chat() {
				return G(n);
			},
			get copy() {
				return t.copy;
			}
		});
	}, _e = (e) => {
		var r = yc(), o = R(r), s = (e) => {
			var n = _c(), r = R(n, !0);
			k(n), B(() => Y(r, t.copy.offlineBadge)), J(e, n);
		};
		X(o, (e) => {
			G(n).offline && e(s);
		});
		var c = z(o, 2), l = (e) => {
			{
				let r = /* @__PURE__ */ M(() => G(n).corpora.length > 1);
				oi(mc(e, {
					get results() {
						return G(n).results;
					},
					get copy() {
						return t.copy;
					},
					get showCorpus() {
						return G(r);
					},
					onexitup: () => G(i)?.focus(),
					onpick: () => setTimeout(m, 0)
				}), (e) => F(a, e, !0), () => G(a));
			}
		}, u = (e) => {
			var n = vc(), r = R(n, !0);
			k(n), B(() => Y(r, t.copy.search.sub)), J(e, n);
		};
		X(c, (e) => {
			G(n).results ? e(l) : e(u, -1);
		});
		var d = z(c, 2), f = (e) => {
			cs(e, {
				get entry() {
					return t.copy.search.error;
				},
				get detail() {
					return G(n).searchError.message;
				},
				resetText: "",
				paidLabel: "",
				onpaid: () => {},
				onretry: b
			});
		};
		X(d, (e) => {
			G(n).searchError && e(f);
		}), k(r), B(() => Z(r, "aria-busy", G(n).searching)), J(e, r);
	};
	X(pe, (e) => {
		G(c) ? e(me) : G(l) ? e(he, 1) : G(o) ? e(ge, 2) : e(_e, -1);
	});
	var ve = z(pe, 2), ye = z(R(ve), 2);
	Qr(ye), oi(ye, (e) => F(i, e), () => G(i));
	var be = z(ye, 2), xe = R(be, !0);
	k(be), k(ve);
	var Se = z(ve, 2), Ce = R(Se), we = R(Ce), Te = (e) => {
		var n = xr();
		B(() => Y(n, t.copy.search.hintLoading)), J(e, n);
	};
	X(we, (e) => {
		!G(s) && !G(c) && !G(l) && e(Te);
	}), k(Ce);
	var T = z(Ce, 2), Ee = R(T, !0);
	k(T), k(Se), k(S), oi(S, (e) => F(r, e), () => G(r)), k(x), B((e) => {
		Z(S, "aria-label", t.copy.search.navLabel), Y(ie, t.copy.search.label), Y(oe, t.copy.search.title), Z(se, "data-tone", G(f)), Z(se, "title", G(u)), Y(le, G(u)), Y(de, G(d)), Z(fe, "aria-label", t.copy.search.closeLabel), Z(ye, "placeholder", t.copy.search.placeholder), Z(ye, "aria-label", t.copy.search.navLabel), ye.disabled = !G(s), be.disabled = e, Y(xe, t.copy.search.submit), Y(Ee, t.copy.search.fine);
	}, [() => !G(s) || !G(n).draft.trim()]), K("click", x, m), K("click", S, (e) => e.stopPropagation()), K("click", fe, m), dr("submit", ve, _), K("keydown", ye, v), ni(ye, () => G(n).draft, (e) => G(n).draft = e), J(e, x), He();
}
fr(["click", "keydown"]);
//#endregion
//#region src/index.js
var Sc = "(max-width: 860px)", Cc = /* @__PURE__ */ new Map(), wc = (e) => `${e.storage.keyPrefix}lattice-wasm`;
function Tc(e) {
	return e.mode === "search" ? JSON.stringify([
		"search",
		e.corpora,
		e.wasm,
		e.search,
		e.storage.keyPrefix
	]) : JSON.stringify([
		"answer",
		e.corpora,
		e.wasm,
		e.provider,
		e.retrieval,
		e.storage.keyPrefix,
		e.brand.productName
	]);
}
var Ec = (e) => e.mode === "search" ? e.search.embedder?.embed ?? null : null;
function Dc(e) {
	return go(e, {
		search: ma(ra(e.wasm, {
			importModule: qi,
			fetch: Gi
		})),
		cache: ka(e.storage.keyPrefix, Pa, {
			getDirectory: Ji(),
			sleep: Hi
		}),
		net: ta({ fetch: Gi }),
		wasmBytes: () => Zi(e.wasm.binUrl, wc(e)),
		sha256: Ki,
		reportCacheFault: (e) => console.error(`repo-chat: browser cache: ${e?.message ?? e}`, e)
	});
}
function Oc(e) {
	let t = Tc(e), n = Cc.get(t);
	if (n && n.embed === Ec(e)) return n.session;
	let r;
	if (e.mode === "search") r = Dc(e);
	else {
		let t = {
			fetch: Gi,
			sleep: Hi
		};
		r = Ro(e, {
			openrouter: Ea(e.provider, t),
			lattice: ra(e.wasm, {
				importModule: qi,
				fetch: Gi
			}),
			cache: ka(e.storage.keyPrefix, Na, {
				getDirectory: Ji(),
				sleep: Hi
			}),
			net: ta({ fetch: Gi }),
			keys: Aa(e.storage.keyPrefix, window.localStorage),
			clock: Ui,
			idleYield: Vi,
			wasmBytes: () => Zi(e.wasm.binUrl, wc(e)),
			reportCacheFault: (e) => console.error(`repo-chat: browser cache: ${e?.message ?? e}`, e)
		});
	}
	return Cc.set(t, {
		session: r,
		embed: Ec(e)
	}), r;
}
function kc(e) {
	if (typeof window > "u" || typeof document > "u") throw Error(`${e} runs in a browser only`);
}
function Ac(e) {
	let t = Bi(e);
	kc("warmRepoChat"), Yi(t.assets.cssHref).catch(() => {}), $i(t.wasm.binUrl, wc(t));
}
function jc(e) {
	let t = Bi(e);
	kc("openRepoChat");
	let n = document.createElement("div");
	n.className = "arr-root";
	for (let [e, r] of fi(t.theme)) n.style.setProperty(e, r);
	let r, i = new Promise((e, t) => {
		r = {
			resolve: e,
			reject: t
		};
	});
	i.catch(() => {});
	let a = null, o = !1, s = !1;
	function c() {
		s || (s = !0, l.abortLoad(), a && Or(a), n.remove(), o || r.reject(/* @__PURE__ */ Error("the chat was closed before its corpora were ready")), t.onClose?.());
	}
	let l = Oc(t);
	return t.mount.appendChild(n), Yi(t.assets.cssHref).catch((e) => {
		console.error(e);
	}).then(() => {
		if (s) return;
		let e = () => {
			o || (o = !0, r.resolve(), t.onReady?.());
		};
		a = t.mode === "search" ? wr(xc, {
			target: n,
			props: {
				session: l,
				copy: t.copy,
				brand: t.brand,
				onclose: c,
				onready: e
			}
		}) : wr($s, {
			target: n,
			props: {
				session: l,
				copy: t.copy,
				brand: t.brand,
				sourcesOpen: !Wi(Sc),
				reducedMotion: () => Wi("(prefers-reduced-motion: reduce)"),
				onclose: c,
				onready: e
			}
		});
	}), {
		close: c,
		ready: i
	};
}
//#endregion
export { li as COPY_EN, pi as ConfigError, jc as openRepoChat, Ac as warmRepoChat };
