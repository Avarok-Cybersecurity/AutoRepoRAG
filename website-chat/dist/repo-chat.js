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
function q(e, t) {
	var n = U;
	n.nodes === null && (n.nodes = {
		start: e,
		end: t,
		a: null,
		t: null
	});
}
/*#__NO_SIDE_EFFECTS__*/
function J(e, t) {
	var n = !!(t & 1), r = !!(t & 2), i, a = !e.startsWith("<!>");
	return () => {
		if (E) return q(D, null), D;
		i === void 0 && (i = _r(a ? e : "<!>" + e), n || (i = /* @__PURE__ */ L(i)));
		var t = r || Qt ? document.importNode(i, !0) : i.cloneNode(!0);
		if (n) {
			var o = /* @__PURE__ */ L(t), s = t.lastChild;
			q(o, s);
		} else q(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function vr(e, t, n = "svg") {
	var r = !e.startsWith("<!>"), i = !!(t & 1), a = `<${n}>${r ? e : "<!>" + e}</${n}>`, o;
	return () => {
		if (E) return q(D, null), D;
		if (!o) {
			var e = /* @__PURE__ */ L(_r(a));
			if (i) for (o = document.createDocumentFragment(); /* @__PURE__ */ L(e);) o.appendChild(/* @__PURE__ */ L(e));
			else o = /* @__PURE__ */ L(e);
		}
		var t = o.cloneNode(!0);
		if (i) {
			var n = /* @__PURE__ */ L(t), r = t.lastChild;
			q(n, r);
		} else q(t, t);
		return t;
	};
}
/*#__NO_SIDE_EFFECTS__*/
function yr(e, t) {
	return /* @__PURE__ */ vr(e, t, "svg");
}
function br(e = "") {
	if (!E) {
		var t = I(e + "");
		return q(t, t), t;
	}
	var n = D;
	return n.nodeType === 3 ? cn(n) : (n.before(n = I()), O(n)), q(n, n), n;
}
function xr() {
	if (E) return q(D, null), D;
	var e = document.createDocumentFragment(), t = document.createComment(""), n = I();
	return e.append(t, n), q(t, n), e;
}
function Y(e, t) {
	if (E) {
		var n = U;
		(!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = D), Ne();
	} else e !== null && e.before(t);
}
function Sr() {
	if (E && D && D.nodeType === 8 && D.textContent?.startsWith("$")) {
		let e = D.textContent.substring(1);
		return Ne(), e;
	}
	return (window.__svelte ??= {}).uid ??= 1, `c${window.__svelte.uid++}`;
}
function X(e, t) {
	var n = t == null ? "" : typeof t == "object" ? `${t}` : t;
	n !== (e[ue] ??= e.nodeValue) && (e[ue] = n, e.nodeValue = `${n}`);
}
function Cr(e, t) {
	return Tr(e, t);
}
var wr = /* @__PURE__ */ new Map();
function Tr(e, { target: t, anchor: n, props: i = {}, events: a, context: o, intro: s = !0, transformError: c }) {
	tn();
	var l = void 0, u = gn(() => {
		var s = n ?? t.appendChild(I());
		ct(s, { pending: () => {} }, (t) => {
			Ve({});
			var n = A;
			if (o && (n.c = o), a && (i.$$events = a), E && q(t, null), l = e(t, i) || {}, E && (U.nodes.end = D, D === null || D.nodeType !== 8 || D.data !== "]")) throw Ae(), Te;
			He();
		}, c);
		var u = /* @__PURE__ */ new Set(), d = (e) => {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (!u.has(r)) {
					u.add(r);
					var i = or(r);
					for (let e of [t, document]) {
						var a = wr.get(e);
						a === void 0 && (a = /* @__PURE__ */ new Map(), wr.set(e, a));
						var o = a.get(r);
						o === void 0 ? (e.addEventListener(r, mr, { passive: i }), a.set(r, 1)) : a.set(r, o + 1);
					}
				}
			}
		};
		return d(r(cr)), lr.add(d), () => {
			for (var e of u) for (let n of [t, document]) {
				var r = wr.get(n), i = r.get(e);
				--i == 0 ? (n.removeEventListener(e, mr), r.delete(e), r.size === 0 && wr.delete(n)) : r.set(e, i);
			}
			lr.delete(d), s !== n && s.parentNode?.removeChild(s);
		};
	});
	return Er.set(l, u), l;
}
var Er = /* @__PURE__ */ new WeakMap();
function Dr(e, t) {
	let n = Er.get(e);
	return n ? (Er.delete(e), n(t)) : Promise.resolve();
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/blocks/branches.js
var Or = class {
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
function Z(e, t, n = !1) {
	var r;
	E && (r = D, Ne());
	var i = new Or(e), a = n ? x : 0;
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
function kr(e, t) {
	return t;
}
function Ar(e, t, n) {
	for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
		let n = t[c];
		Dn(n, () => {
			if (o) {
				if (o.pending.delete(n), o.done.add(n), o.pending.size === 0) {
					var t = e.outrogroups;
					jr(e, r(o.done)), t.delete(o), t.size === 0 && (e.outrogroups = null);
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
		jr(e, t, !l);
	} else o = {
		pending: new Set(t),
		done: /* @__PURE__ */ new Set()
	}, (e.outrogroups ??= /* @__PURE__ */ new Set()).add(o);
}
function jr(e, t, n = !0) {
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
var Mr;
function Nr(t, n, i, a, o, s = null) {
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
		v.effect.f & 16384 || (v.pending.delete(e), v.fallback = d, Fr(v, p, c, n, a), d !== null && (p.length === 0 ? d.f & 33554432 ? (d.f ^= te, Lr(d, null, c)) : kn(d) : Dn(d, () => {
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
				S ? (S.v && Kt(S.v, b), S.i && Kt(S.i, y), v && u.unskip_effect(S.e)) : (S = Ir(l, h ? c : Mr ??= I(), b, x, y, o, n, i), h || (S.e.f |= te), l.set(x, S)), r.add(x);
			}
			if (e === 0 && s && !d && (h ? d = xn(() => s(c)) : (d = xn(() => s(Mr ??= I())), d.f |= te)), e > r.size && he("", "", ""), E && e > 0 && O(Fe()), !h) {
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
function Pr(e) {
	for (; e !== null && !(e.f & 32);) e = e.next;
	return e;
}
function Fr(e, t, n, i, a) {
	var o = !!(i & 8), s = t.length, c = e.items, l = Pr(e.effect.first), u, d = null, f, p = [], m = [], h, g, _, v;
	if (o) for (v = 0; v < s; v += 1) h = t[v], g = a(h, v), _ = c.get(g).e, _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(_));
	for (v = 0; v < s; v += 1) {
		if (h = t[v], g = a(h, v), _ = c.get(g).e, e.outrogroups !== null) for (let t of e.outrogroups) t.pending.delete(_), t.done.delete(_);
		if (_.f & 8192 && (kn(_), o && (_.nodes?.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(_))), _.f & 33554432) {
			if (_.f ^= te, _ === l) Lr(_, null, n);
			else {
				var y = d ? d.next : l;
				_ === e.effect.last && (e.effect.last = _.prev), _.prev && (_.prev.next = _.next), _.next && (_.next.prev = _.prev), Rr(e, d, _), Rr(e, _, y), Lr(_, y, n), d = _, p = [], m = [], l = Pr(d.next);
				continue;
			}
		}
		if (_ !== l) {
			if (u !== void 0 && u.has(_)) {
				if (p.length < m.length) {
					var b = m[0], x;
					d = b.prev;
					var S = p[0], ee = p[p.length - 1];
					for (x = 0; x < p.length; x += 1) Lr(p[x], b, n);
					for (x = 0; x < m.length; x += 1) u.delete(m[x]);
					Rr(e, S.prev, ee.next), Rr(e, d, S), Rr(e, ee, b), l = b, d = ee, --v, p = [], m = [];
				} else u.delete(_), Lr(_, l, n), Rr(e, _.prev, _.next), Rr(e, _, d === null ? e.effect.first : d.next), Rr(e, d, _), d = _;
				continue;
			}
			for (p = [], m = []; l !== null && l !== _;) (u ??= /* @__PURE__ */ new Set()).add(l), m.push(l), l = Pr(l.next);
			if (l === null) continue;
		}
		_.f & 33554432 || p.push(_), d = _, l = Pr(_.next);
	}
	if (e.outrogroups !== null) {
		for (let t of e.outrogroups) t.pending.size === 0 && (jr(e, r(t.done)), e.outrogroups?.delete(t));
		e.outrogroups.size === 0 && (e.outrogroups = null);
	}
	if (l !== null || u !== void 0) {
		var C = [];
		if (u !== void 0) for (_ of u) _.f & 8192 || C.push(_);
		for (; l !== null;) !(l.f & 8192) && l !== e.fallback && C.push(l), l = Pr(l.next);
		var w = C.length;
		if (w > 0) {
			var ne = i & 4 && s === 0 ? n : null;
			if (o) {
				for (v = 0; v < w; v += 1) C[v].nodes?.a?.measure();
				for (v = 0; v < w; v += 1) C[v].nodes?.a?.fix();
			}
			Ar(e, C, ne);
		}
	}
	o && Ke(() => {
		if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
	});
}
function Ir(e, t, n, r, i, a, o, s) {
	var c = o & 1 ? o & 16 ? Wt(n) : /* @__PURE__ */ Gt(n, !1, !1) : null, l = o & 2 ? Wt(i) : null;
	return {
		v: c,
		i: l,
		e: xn(() => (a(t, c ?? n, l ?? i, s), () => {
			e.delete(r);
		}))
	};
}
function Lr(e, t, n) {
	if (e.nodes) for (var r = e.nodes.start, i = e.nodes.end, a = t && !(t.f & 33554432) ? t.nodes.start : n; r !== null;) {
		var o = /* @__PURE__ */ nn(r);
		if (a.before(r), r === i) return;
		r = o;
	}
}
function Rr(e, t, n) {
	t === null ? e.effect.first = n : t.next = n, n === null ? e.effect.last = t : n.prev = t;
}
function zr(e, t, n = !1, r = !1, i = !1, a = !1) {
	var o = e, s = "";
	if (n) {
		var c = e;
		E && (o = O(/* @__PURE__ */ L(c)));
	}
	B(() => {
		var e = U;
		if (s === (s = t() ?? "")) E && Ne();
		else if (n && !E) e.nodes = null, c.innerHTML = s, s !== "" && q(/* @__PURE__ */ L(c), c.lastChild);
		else if (e.nodes !== null && (Tn(e.nodes.start, e.nodes.end), e.nodes = null), s !== "") {
			if (E) {
				for (var a = D.data, l = Ne(), u = l; l !== null && (l.nodeType !== 8 || l.data !== "");) u = l, l = /* @__PURE__ */ nn(l);
				if (l === null) throw Ae(), Te;
				q(D, u), o = O(l);
			} else {
				var d = sn(r ? "svg" : i ? "math" : "template", r ? De : i ? Oe : void 0);
				d.innerHTML = s;
				var f = r || i ? d : d.content;
				if (q(/* @__PURE__ */ L(f), f.lastChild), r || i) for (; /* @__PURE__ */ L(f);) o.before(/* @__PURE__ */ L(f));
				else o.before(f);
			}
		}
	});
}
//#endregion
//#region node_modules/svelte/src/internal/shared/attributes.js
var Br = [..." 	\n\r\f\xA0\v﻿"];
function Vr(e, t, n) {
	var r = e == null ? "" : "" + e;
	if (t && (r = r ? r + " " + t : t), n) {
		for (var i of Object.keys(n)) if (n[i]) r = r ? r + " " + i : i;
		else if (r.length) for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0;) {
			var s = o + a;
			(o === 0 || Br.includes(r[o - 1])) && (s === r.length || Br.includes(r[s])) ? r = (o === 0 ? "" : r.substring(0, o)) + r.substring(s + 1) : o = s;
		}
	}
	return r === "" ? null : r;
}
function Hr(e, t = !1) {
	var n = t ? " !important;" : ";", r = "";
	for (var i of Object.keys(e)) {
		var a = e[i];
		a != null && a !== "" && (r += " " + i + ": " + a + n);
	}
	return r;
}
function Ur(e) {
	return e[0] !== "-" || e[1] !== "-" ? e.toLowerCase() : e;
}
function Wr(e, t) {
	if (t) {
		var n = "", r, i;
		if (Array.isArray(t) ? (r = t[0], i = t[1]) : r = t, e) {
			e = String(e).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
			var a = !1, o = 0, s = !1, c = [];
			r && c.push(...Object.keys(r).map(Ur)), i && c.push(...Object.keys(i).map(Ur));
			var l = 0, u = -1;
			let t = e.length;
			for (var d = 0; d < t; d++) {
				var f = e[d];
				if (s ? f === "/" && e[d - 1] === "*" && (s = !1) : a ? a === f && (a = !1) : f === "/" && e[d + 1] === "*" ? s = !0 : f === "\"" || f === "'" ? a = f : f === "(" ? o++ : f === ")" && o--, !s && a === !1 && o === 0) {
					if (f === ":" && u === -1) u = d;
					else if (f === ";" || d === t - 1) {
						if (u !== -1) {
							var p = Ur(e.substring(l, u).trim());
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
		return r && (n += Hr(r)), i && (n += Hr(i, !0)), n = n.trim(), n === "" ? null : n;
	}
	return e == null ? null : String(e);
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/class.js
function Gr(e, t, n, r, i, a) {
	var o = e[ce];
	if (E || o !== n || o === void 0) {
		var s = Vr(n, r, a);
		(!E || s !== e.getAttribute("class")) && (s == null ? e.removeAttribute("class") : t ? e.className = s : e.setAttribute("class", s)), e[ce] = n;
	} else if (a && i !== a) for (var c in a) {
		var l = !!a[c];
		(i == null || l !== !!i[c]) && e.classList.toggle(c, l);
	}
	return a;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/style.js
function Kr(e, t = {}, n, r) {
	for (var i in n) {
		var a = n[i];
		t[i] !== a && (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
	}
}
function qr(e, t, n, r) {
	var i = e[le];
	if (E || i !== t) {
		var a = Wr(t, r);
		(!E || a !== e.getAttribute("style")) && (a == null ? e.removeAttribute("style") : e.style.cssText = a), e[le] = t;
	} else r && (Array.isArray(r) ? (Kr(e, n?.[0], r[0]), Kr(e, n?.[1], r[1], "important")) : Kr(e, n, r));
	return r;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/attributes.js
var Jr = Symbol("is custom element"), Yr = Symbol("is html"), Xr = pe ? "link" : "LINK";
function Zr(e) {
	if (E) {
		var t = !1, n = () => {
			if (!t) {
				if (t = !0, e.hasAttribute("value")) {
					var n = e.value;
					Q(e, "value", null), e.value = n;
				}
				if (e.hasAttribute("checked")) {
					var r = e.checked;
					Q(e, "checked", null), e.checked = r;
				}
			}
		};
		e[de] = n, Ke(n), rt();
	}
}
function Q(e, t, n, r) {
	var i = Qr(e);
	E && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === Xr) || i[t] !== (i[t] = n) && (t === "loading" && (e[oe] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && ei(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
function Qr(e) {
	return e[se] ??= {
		[Jr]: e.nodeName.includes("-"),
		[Yr]: e.namespaceURI === Ee
	};
}
var $r = /* @__PURE__ */ new Map();
function ei(e) {
	var t = e.getAttribute("is") || e.nodeName, n = $r.get(t);
	if (n) return n;
	$r.set(t, n = []);
	for (var r, i = e, a = Element.prototype; a !== i;) {
		for (var s in r = o(i), r) r[s].set && s !== "innerHTML" && s !== "textContent" && s !== "innerText" && n.push(s);
		i = l(i);
	}
	return n;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function ti(e, t, n = t) {
	var r = /* @__PURE__ */ new WeakSet();
	at(e, "input", async (i) => {
		var a = i ? e.defaultValue : e.value;
		if (a = ni(e) ? ri(a) : a, n(a), N !== null && r.add(N), await tr(), a !== (a = t())) {
			var o = e.selectionStart, s = e.selectionEnd, c = e.value.length;
			if (e.value = a ?? "", s !== null) {
				var l = e.value.length;
				o === s && s === c && l > c ? (e.selectionStart = l, e.selectionEnd = l) : (e.selectionStart = o, e.selectionEnd = Math.min(s, l));
			}
		}
	}), (E && e.defaultValue !== e.value || ir(t) == null && e.value) && (n(ni(e) ? ri(e.value) : e.value), N !== null && r.add(N)), yn(() => {
		var n = t();
		if (e === document.activeElement) {
			var i = N;
			if (r.has(i)) return;
		}
		ni(e) && n === ri(e.value) || (e.type !== "date" || n || e.value) && n !== e.value && (e.value = n ?? "");
	});
}
function ni(e) {
	var t = e.type;
	return t === "number" || t === "range";
}
function ri(e) {
	return e === "" ? null : +e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function ii(e, t) {
	return e === t || e?.[ie] === t;
}
function ai(e = {}, t, n, r) {
	var i = A.r, a = U;
	return _n(() => {
		var o, s;
		return yn(() => {
			o = s, s = r?.() || [], ir(() => {
				ii(n(...s), e) || (t(e, ...s), o && ii(n(...o), e) && t(null, ...o));
			});
		}), () => {
			let r = a;
			for (; r !== i && r.parent !== null && r.parent.f & 33554432;) r = r.parent;
			let o = () => {
				s && ii(n(...s), e) && t(null, ...s);
			}, c = r.teardown;
			r.teardown = () => {
				o(), c?.();
			};
		};
	}), e;
}
//#endregion
//#region node_modules/svelte/src/internal/client/reactivity/props.js
function oi(e, t, n, r) {
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
function si(e) {
	if (e && typeof e == "object") {
		for (let t of Object.values(e)) si(t);
		Object.freeze(e);
	}
	return e;
}
var ci = si({
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
}), li = Object.freeze([
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
function ui(e) {
	return `--arr-${e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`;
}
function di(e) {
	return li.map((t) => [ui(t), e[t]]);
}
//#endregion
//#region src/config/validate.js
var fi = class extends Error {
	constructor(e) {
		super(`openRepoChat: invalid config (${e.length} problem${e.length === 1 ? "" : "s"}):\n${e.map((e) => `  - ${e}`).join("\n")}`), this.name = "ConfigError", this.problems = e;
	}
}, pi = /^[a-z0-9][a-z0-9_-]{0,63}$/, mi = /^[A-Za-z0-9._-]{1,64}$/, hi = /^https?:\/\/[^\s/]+/, gi = /\{(\w+)\}/g, _i = (e) => typeof e == "object" && !!e && !Array.isArray(e) && Object.getPrototypeOf(e) === Object.prototype, vi = (e) => typeof e == "string" && e.trim() !== "" ? null : "must be a non-empty string", yi = (e) => vi(e) ?? (hi.test(e) ? null : "must be an absolute http(s) URL"), bi = (e) => (t) => Number.isSafeInteger(t) && t >= e ? null : `must be an integer >= ${e}`, xi = (e) => typeof e == "string" && mi.test(e) ? null : "must be 1-64 characters of [A-Za-z0-9._-]", Si = (e) => e === null || typeof e == "string" && /^\s*<svg[\s>]/.test(e) && /<\/svg>\s*$/.test(e) ? null : "must be null (no watermark) or a complete <svg>...</svg> string", Ci = (e) => typeof e == "object" && e && e.nodeType === 1 && typeof e.appendChild == "function" ? null : "must be a DOM Element", wi = (e) => typeof e == "function" ? null : "must be a function", $ = (e) => ({
	kind: "leaf",
	check: e
}), Ti = (e) => ({
	kind: "leaf",
	check: e,
	optional: !0
}), Ei = (e) => ({
	kind: "object",
	fields: e
}), Di = Ei({
	mount: $(Ci),
	assets: Ei({ cssHref: $(vi) }),
	wasm: Ei({
		jsUrl: $(vi),
		binUrl: $(vi)
	}),
	corpora: { kind: "corpora" },
	provider: Ei({
		apiUrl: $(yi),
		rerankModel: $(vi),
		chatModel: $(vi),
		appTitle: $(vi),
		referer: $(yi),
		maxAttempts: $(bi(1)),
		retryBaseMs: $(bi(0))
	}),
	retrieval: Ei({
		topK: $(bi(1)),
		rerankMultiplier: $(bi(1)),
		upsertBatch: $(bi(1))
	}),
	storage: Ei({ keyPrefix: $(xi) }),
	copy: { kind: "copy" },
	brand: Ei({
		productName: $(vi),
		motifSvg: $(Si)
	}),
	theme: Ei(Object.fromEntries(li.map((e) => [e, $(vi)]))),
	onReady: Ti(wi),
	onClose: Ti(wi)
});
function Oi(e, t, n, r) {
	if (e.kind === "leaf") {
		if (t === void 0) {
			e.optional || r.push(`${n}: missing`);
			return;
		}
		let i = e.check(t);
		i && r.push(`${n}: ${i}`);
		return;
	}
	if (e.kind === "corpora") return ki(t, n, r);
	if (e.kind === "copy") return ji(ci, t, n, r);
	t !== void 0 && !_i(t) && (r.push(`${n}: must be an object`), t = void 0);
	let i = t ?? {};
	for (let [t, a] of Object.entries(e.fields)) Oi(a, i[t], n ? `${n}.${t}` : t, r);
	for (let t of Object.keys(i)) t in e.fields || r.push(`${n ? `${n}.` : ""}${t}: unknown key`);
}
function ki(e, t, n) {
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
		Oi(Ei({
			id: $((e) => typeof e == "string" && pi.test(e) ? null : "must match /^[a-z0-9][a-z0-9_-]{0,63}$/"),
			gzUrl: $(vi),
			metaUrl: $(vi)
		}), e, a, n);
		let o = _i(e) ? e.id : void 0;
		typeof o == "string" && (r.has(o) && n.push(`${a}.id: duplicate corpus id ${JSON.stringify(o)}`), r.add(o));
	});
}
function Ai(e) {
	return [...e.matchAll(gi)].map((e) => e[1]);
}
function ji(e, t, n, r) {
	if (t === void 0) r.push(`${n}: missing (start from COPY_EN: { ...COPY_EN, ... })`);
	else if (typeof e == "string") {
		let i = vi(t);
		if (i) {
			r.push(`${n}: ${i}`);
			return;
		}
		let a = new Set(Ai(e));
		for (let e of Ai(t)) a.has(e) || r.push(`${n}: unknown placeholder {${e}} (allowed: ${[...a].map((e) => `{${e}}`).join(" ") || "none"})`);
	} else if (Array.isArray(e)) (!Array.isArray(t) || t.some((e) => vi(e) !== null)) && r.push(`${n}: must be an array of non-empty strings`);
	else if (!_i(t)) r.push(`${n}: must be an object`);
	else {
		for (let [i, a] of Object.entries(e)) ji(a, t[i], `${n}.${i}`, r);
		for (let i of Object.keys(t)) i in e || r.push(`${n}.${i}: unknown key`);
	}
}
function Mi(e) {
	let t = [];
	if (_i(e) ? Oi(Di, e, "", t) : (t.push("config: must be a plain object"), Oi(Di, void 0, "", t)), t.length > 0) throw new fi(t);
	return e;
}
//#endregion
//#region src/adapters/browser.js
function Ni() {
	return new Promise((e) => {
		typeof requestIdleCallback == "function" ? requestIdleCallback(() => e(), { timeout: 100 }) : setTimeout(e, 0);
	});
}
var Pi = (e) => new Promise((t) => setTimeout(t, e)), Fi = {
	now: () => performance.now(),
	epochMs: () => Date.now(),
	requestFrame: (e) => requestAnimationFrame(e),
	cancelFrame: (e) => cancelAnimationFrame(e)
}, Ii = (e) => typeof window < "u" && window.matchMedia(e).matches, Li = (e, t) => globalThis.fetch(e, t), Ri = (e) => import(
	/* @vite-ignore */
	e
), zi = () => typeof navigator < "u" && navigator.storage?.getDirectory ? () => navigator.storage.getDirectory() : null;
function Bi(e) {
	let t = [...document.querySelectorAll("link[rel=\"stylesheet\"][data-repo-chat]")].find((t) => t.getAttribute("href") === e);
	if (t?.dataset.repoChat === "loaded") return Promise.resolve();
	let n = t ?? document.createElement("link"), r = new Promise((t, r) => {
		n.addEventListener("load", () => {
			n.dataset.repoChat = "loaded", t();
		}, { once: !0 }), n.addEventListener("error", () => r(/* @__PURE__ */ Error(`stylesheet ${e} failed to load`)), { once: !0 });
	});
	return t || (n.rel = "stylesheet", n.href = e, n.dataset.repoChat = "pending", document.head.appendChild(n)), r;
}
function Vi() {
	let e = typeof navigator < "u" ? navigator.connection : void 0;
	return !e || !(e.saveData || typeof e.effectiveType == "string" && /(^|-)2g$/.test(e.effectiveType));
}
async function Hi(e, t) {
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
var Ui = /* @__PURE__ */ new Set();
function Wi(e, t) {
	if (Ui.has(e) || typeof window > "u" || typeof caches > "u" || !Vi()) return;
	Ui.add(e);
	let n = async () => {
		try {
			let n = await caches.open(t);
			if (await n.match(e)) return;
			let r = await fetch(e, { priority: "low" });
			r.ok && await n.put(e, r);
		} catch {
			Ui.delete(e);
		}
	};
	typeof requestIdleCallback == "function" ? requestIdleCallback(() => void n(), { timeout: 4e3 }) : setTimeout(() => void n(), 2e3);
}
//#endregion
//#region src/adapters/corpus.js
var Gi = class extends Error {
	constructor(e, { network: t, status: n }) {
		super(e), this.name = "CorpusFetchError", this.network = t, this.status = n;
	}
};
function Ki(e) {
	async function t(t, n, r) {
		try {
			return await e.fetch(n, r);
		} catch (e) {
			throw e?.name === "AbortError" ? e : new Gi(`${t} unreachable: ${e?.message ?? e}`, {
				network: !0,
				status: null
			});
		}
	}
	let n = (e, t) => new Gi(`${e} failed: HTTP ${t.status}`, {
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
	return {
		fetchMeta: r,
		openCorpus: i,
		gunzip: a
	};
}
//#endregion
//#region src/adapters/lattice.js
function qi(e, t) {
	if (e && e.status === "ok" && e.result !== void 0) return e.result;
	throw Error(`${t} failed: ${e && e.error || "unknown wasm error"}`);
}
function Ji(e, t) {
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
		let e = qi(a().listCollections(), "listCollections");
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
		return qi(a().upsert(e, t), "upsert");
	}
	function l(e, t, n) {
		return qi(a().search(e, new Float32Array(t), n, { with_payload: !0 }), "search");
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
var Yi = class extends Error {
	constructor(e, t, { quota: n = !1, resetAt: r = null } = {}) {
		super(e), this.name = "OpenRouterError", this.transient = t, this.quota = n, this.resetAt = r;
	}
}, Xi = class extends Yi {
	constructor(e) {
		super(`could not reach OpenRouter: ${e?.message ?? e}`, !0), this.name = "OpenRouterUnreachable", this.network = !0;
	}
}, Zi = class extends Yi {
	constructor(e) {
		super(e, !0), this.name = "OpenRouterServiceError", this.service = !0;
	}
};
function Qi(e, t, n) {
	return t >= 500 ? new Zi(e) : new Yi(e, n);
}
var $i = /free-models-per-day|per-?day|daily/i;
function ea(e, t) {
	let n = e?.metadata ?? {}, r = String(n.limit_source ?? ""), i = String(e?.message ?? "");
	if (!$i.test(r) && !$i.test(i)) return null;
	let a = n.headers?.["X-RateLimit-Reset"] ?? t?.headers?.get?.("X-RateLimit-Reset"), o = Number(a);
	return { resetAt: Number.isFinite(o) && o > 0 ? o : null };
}
function ta(e, t, n) {
	return new Yi(`${e} failed: ${t}`, !1, {
		quota: !0,
		resetAt: n.resetAt
	});
}
var na = /ResourceExhausted|rate.?limit|overloaded/i;
async function ra(e, t) {
	let n = await e.text();
	if (!e.ok) {
		let r = null;
		try {
			r = JSON.parse(n);
		} catch {}
		let i = e.status === 429 ? ea(r?.error, e) : null;
		throw i ? ta(t, r.error.message ?? "daily limit reached", i) : Qi(`${t} failed: ${e.status} - ${n}`, e.status, e.status === 429);
	}
	let r;
	try {
		r = JSON.parse(n);
	} catch {
		throw new Yi(`${t} returned invalid JSON: ${n.slice(0, 200)}`, !1);
	}
	let i = r?.error;
	if (i) {
		let n = i.code ?? 0, r = i.message ?? "unknown error", a = ea(i, e);
		throw a ? ta(t, r, a) : Qi(`${t} failed${n ? ` (${n})` : ""}: ${r}`, n, n === 429 || na.test(r));
	}
	return r;
}
function ia(e) {
	if (typeof e.reasoning == "string" && e.reasoning) return e.reasoning;
	if (Array.isArray(e.reasoning_details)) {
		let t = "";
		for (let n of e.reasoning_details) typeof n?.text == "string" ? t += n.text : typeof n?.summary == "string" && (t += n.summary);
		if (t) return t;
	}
}
async function aa(e, t) {
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
					let e = r.error.message ?? "unknown error", t = ea(r.error, null);
					throw t ? ta("Chat request", e, t) : Qi(`Chat request failed: ${e}`, r.error.code, r.error.code === 429 || na.test(e));
				}
				let a = r.choices?.[0]?.delta;
				if (!a) continue;
				let s = ia(a), c = typeof a.content == "string" && a.content ? a.content : void 0;
				(s || c) && t(s, c);
			}
		}
	} finally {
		n.releaseLock?.();
	}
}
function oa(e, t) {
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
			if (t = e, !(e instanceof Yi && e.transient) || n === a) break;
			await c(n);
		}
		throw t;
	}
	let u = (e, r, i) => t.fetch(`${n}${e}`, {
		method: "POST",
		headers: s(r),
		body: i
	}).catch((e) => {
		throw new Xi(e);
	});
	async function d(e, t, n) {
		if (e.length === 0) return [];
		let r = await l(async () => ra(await u("/embeddings", t, JSON.stringify({
			model: n,
			input: e
		})), "Embedding request"));
		if (!Array.isArray(r?.data)) throw new Yi("Embedding request returned no embeddings.", !1);
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
				let t = (await ra(e, "Chat request")).choices?.[0]?.message?.content;
				if (t === void 0) throw Error("Chat request returned no message content");
				d(void 0, t);
			} else {
				if (!e.body) throw new Yi("Chat request returned no response stream", !0);
				await aa(e.body, d);
			}
		};
		for (let e = 1;; e++) try {
			return await f(), s;
		} catch (t) {
			if (!(t instanceof Yi && t.transient) || l || e >= a) throw t;
			await c(e);
		}
	}
	async function m(e, t, n, r, i) {
		let a = await l(async () => ra(await u("/rerank", n, JSON.stringify({
			model: i,
			query: e,
			documents: t,
			top_n: r,
			return_documents: !1
		})), "Rerank request"));
		if (!Array.isArray(a?.results)) throw new Yi("Rerank request returned no results.", !1);
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
var sa = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function ca(e, t, n) {
	return `${e}~${t}@${n}.jsonl`;
}
function la(e, t, n) {
	return `${e}~${t}@${n}.meta.json`;
}
function ua(e, t, n) {
	let r = RegExp(`^${sa(`${e}~${t}@`)}([0-9a-f]{7,64})\\.jsonl$`).exec(n);
	return r ? r[1] : null;
}
function da(e, t, n) {
	let r = RegExp(`^${sa(`${e}~${t}@`)}([0-9a-f]{7,64})\\.meta\\.json$`).exec(n);
	return r ? r[1] : null;
}
//#endregion
//#region src/adapters/opfs.js
function fa(e, t) {
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
			let n = await (await a.getFileHandle(ca(e, t, r))).getFile();
			return i !== null && n.size !== i ? null : n;
		} catch {
			return null;
		}
	}
	async function i(t, r) {
		let i = await n();
		if (!i) return null;
		let a = ca(e, t, r), o;
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
			let n = await (await a.getFileHandle(la(e, t, r), { create: !0 })).createWritable({ keepExistingData: !1 });
			await n.write(JSON.stringify(i)), await n.close();
		} catch {}
	}
	async function o(t, n) {
		let r = [];
		try {
			for await (let [i, a] of t) {
				if (a.kind !== "file") continue;
				let t = ua(e, n, i), o = t ? null : da(e, n, i);
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
function pa(e, t) {
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
function ma(e) {
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
function ha(e) {
	return /gzip|decompress|inflate|corrupt/i.test(String(e?.message)) ? "decompress" : "corpus";
}
function ga(e) {
	return e?.network === !0 ? "manifest" : "unavailable";
}
function _a(e) {
	return Number.isInteger(e?.status) ? "unavailable" : "corpus";
}
//#endregion
//#region src/core/prompt.js
function va(e) {
	return Math.max(0, Math.min(100, (1 - e) * 100));
}
function ya(e, t, n, r, i) {
	return `https://github.com/${e}/blob/${t}/${n}#L${r}-L${i}`;
}
function ba(e, { repo: t, path: n, startLine: r, endLine: i, language: a, text: o }) {
	return `[${e}] ${t} ${n} lines ${r}–${i}\n\`\`\`${a || ""}\n${o}\n\`\`\``;
}
function xa(e) {
	return e.map((e) => `GitHub repository ${e.repo}, commit ${e.commit}`).join("; ");
}
function Sa(e, t, n) {
	return `You are the code assistant for the ${e} codebase (${xa(t)}). Answer questions about this codebase using ONLY the numbered code context below.\n\nRules:\n- Cite the context blocks you draw from inline with bracketed numbers, e.g. [1] or [2].\n- If the context does not contain what is needed to answer, say plainly that the retrieved code does not cover it. Never invent file names, functions, or behavior.\n- Be concise and technical. Prefer short code excerpts over prose when they answer better.\n\nContext:\n${n}`;
}
var Ca = "No relevant code was found in the corpus for this question.";
//#endregion
//#region src/core/rag.js
function wa(e, t) {
	return e.flatMap(({ corpus: e, hits: t }) => t.map((t) => ({
		corpus: e,
		id: Number(t.id),
		score: t.score,
		payload: t.payload ?? {}
	})).filter((e) => typeof e.payload.text == "string")).sort((e, t) => e.score - t.score).slice(0, t);
}
function Ta(e, t, n) {
	return e.slice(0, n).filter(({ index: e }) => Number.isInteger(e) && e >= 0 && e < t.length).map(({ index: e }) => t[e]);
}
function Ea(e, t) {
	let n = e.payload, r = Number(n.start_line), i = Number(n.end_line);
	return {
		n: t,
		corpusId: e.corpus.id,
		repo: e.corpus.repo,
		path: n.path,
		startLine: r,
		endLine: i,
		score: e.score,
		relevancePct: va(e.score),
		url: ya(e.corpus.repo, e.corpus.commit, n.path, r, i)
	};
}
async function Da(e, t, n) {
	let { openrouter: r, lattice: i, corpora: a, embedding: o, retrieval: s, productName: c, rerankModel: l, chatModel: u, apiKey: d, onPhase: f, onDelta: p } = n;
	f("retrieving");
	let m = await r.getEmbedding(e, d, o.model);
	if (!Array.isArray(m) || m.length !== o.dim) throw Error(`The embedding model returned ${m?.length ?? 0} dimensions but this corpus was built with ${o.dim}. The site's embedding model and the published corpus are out of sync — the corpus needs a rebuild against the current model.`);
	let h = s.topK * s.rerankMultiplier, g = wa(a.map((e) => ({
		corpus: e,
		hits: i.search(e.collection, m, h)
	})), h), _;
	g.length > 1 ? (f("reranking"), _ = Ta(await r.rerank(e, g.map((e) => e.payload.text), d, s.topK, l), g, s.topK)) : _ = g.slice(0, s.topK);
	let v = _.map((e, t) => Ea(e, t + 1)), y = _.length > 0 ? _.map((e, t) => ba(t + 1, {
		repo: e.corpus.repo,
		path: e.payload.path,
		startLine: Number(e.payload.start_line),
		endLine: Number(e.payload.end_line),
		language: e.payload.language,
		text: e.payload.text
	})).join("\n\n") : Ca;
	return f("thinking"), {
		answer: await r.chat([...t, {
			role: "user",
			content: e
		}], Sa(c, a, y), d, {
			onDelta: p,
			model: u
		}),
		sources: v
	};
}
//#endregion
//#region src/state/conversation.svelte.js
var Oa = [
	"rate",
	"quota",
	"key",
	"network",
	"service"
];
function ka(e) {
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
				kind: Oa.includes(e) ? e : "generic",
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
function Aa(e, t) {
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
function ja(e) {
	let t = JSON.parse(e);
	return t?.t === "point" ? {
		id: t.id,
		vector: t.vector,
		payload: t.payload
	} : null;
}
function Ma(e) {
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
//#region src/core/template.js
function Na(e, t) {
	return e.replace(/\{(\w+)\}/g, (n, r) => {
		if (!Object.hasOwn(t, r)) throw Error(`copy template ${JSON.stringify(e)} names {${r}} but no value was given`);
		return String(t[r]);
	});
}
//#endregion
//#region src/core/consent.js
function Pa(e, t) {
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
function Fa(e, t) {
	return e < 999950 ? Na(t.size.kb, { n: (e / 1e3).toFixed(1) }) : Na(t.size.mb, { n: (e / 1e6).toFixed(1) });
}
//#endregion
//#region src/core/manifest.js
var Ia = /^[0-9a-f]{7,64}$/, La = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, Ra = (e) => Number.isSafeInteger(e) && e >= 0;
function za(e, t) {
	let n = (e) => /* @__PURE__ */ Error(`corpus "${t}" manifest: ${e}`);
	if (typeof e != "object" || !e || Array.isArray(e)) throw n("is not a JSON object");
	if (typeof e.commit_sha != "string" || !Ia.test(e.commit_sha)) throw n("commit_sha must be a hex commit string");
	if (!Number.isSafeInteger(e.dim) || e.dim < 1) throw n("dim must be a positive integer");
	if (typeof e.model != "string" || e.model.trim() === "") throw n("model must name the embedding model");
	if (typeof e.repo != "string" || !La.test(e.repo)) throw n("repo must be \"owner/name\"");
	for (let t of [
		"points",
		"files",
		"bytes",
		"gz_bytes"
	]) if (!Ra(e[t])) throw n(`${t} must be a non-negative integer`);
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
function Ba(e) {
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
var Va = class extends Error {
	constructor() {
		super("load aborted"), this.name = "AbortError";
	}
}, Ha = class extends Error {
	constructor() {
		super("load failed"), this.name = "FailedError";
	}
};
function Ua({ chat: e, corpora: t, upsertBatch: n, ports: r }) {
	let { lattice: i, cache: a, net: o, idleYield: s, wasmBytes: c } = r, l = null, u = null, d = null, f = null, p = !1, m = null, h = !1, g = (e) => {
		if (e.aborted) throw new Va();
	};
	function _() {
		e.progress.loadedBytes = 0, e.progress.totalBytes = 0, e.progress.indexed = 0, e.progress.totalPoints = 0;
	}
	function v(t, n) {
		return e.status = "error", e.error = {
			kind: t,
			message: n?.message ? String(n.message) : String(n)
		}, new Ha();
	}
	async function y() {
		let e = d;
		d = null, e && await e.discard().catch(() => void 0);
	}
	function b() {
		if (e.status === "ready") return Promise.resolve();
		if (l) return l;
		let t = { aborted: !1 };
		return f = t, l = te(t).catch((n) => {
			t.aborted || n?.name === "AbortError" || n instanceof Ha || e.error || v("corpus", n);
		}).finally(() => {
			e.status !== "ready" && (l = null), f === t && (f = null), u = null, d = null;
		}), l;
	}
	function x() {
		if (e.status === "ready" || e.status === "idle") return;
		f && (f.aborted = !0), p = !1, m?.reject(new Va()), m = null, e.consent = null, u?.abort();
		let t = d;
		d = null, t && t.discard().catch(() => void 0), l = null, e.error = null, e.offline = !1, _(), e.status = "idle";
	}
	function S() {
		m &&= (p = !0, e.consent = null, m.resolve(), null);
	}
	function ee(t) {
		return e.consent = t, e.status = "consent", new Promise((e, t) => {
			m = {
				resolve: e,
				reject: t
			};
		});
	}
	async function te(n) {
		e.error = null, e.offline = !1, _(), e.status = "manifest";
		let r = [];
		for (let e of t) r.push(await C(n, e));
		let o;
		try {
			o = Ba(r.map((e) => ({
				id: e.corpus.id,
				meta: e.meta
			})));
		} catch (e) {
			throw v("config", e);
		}
		for (let e of r) e.file ||= await a.getCachedCorpus(e.corpus.id, e.meta.commitSha, e.meta.bytes), g(n);
		if (!p && r.some((e) => !e.file)) {
			let e = h ? 0 : await c();
			g(n), await ee(Pa(r, e)), g(n);
		}
		e.status = "wasm-init";
		try {
			await i.init();
		} catch (e) {
			throw v("wasm", e);
		}
		h = !0, g(n), e.progress.totalBytes = r.reduce((e, t) => e + (t.file ? t.file.size : t.meta.gzBytes), 0), e.progress.totalPoints = r.reduce((e, t) => e + t.meta.points, 0);
		let s = [];
		for (let e of r) {
			let t = e.file ? await w(n, e) : await ne(n, e);
			g(n), s.push({
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
	async function C(t, n) {
		let r;
		try {
			return r = await o.fetchMeta(n.metaUrl), {
				corpus: n,
				raw: r,
				meta: za(r, n.id),
				file: null
			};
		} catch (r) {
			g(t);
			let i = await a.newestOffline(n.id);
			if (g(t), !i) throw v(ga(r), r);
			let o;
			try {
				o = za(i.rawMeta, n.id);
			} catch {
				throw v(ga(r), r);
			}
			if (o.commitSha !== i.sha) throw v(ga(r), r);
			return e.offline = !0, {
				corpus: n,
				raw: i.rawMeta,
				meta: o,
				file: i.file
			};
		}
	}
	async function w(t, n) {
		return e.status = "loading-cached", re(t, n.file.stream(), {
			collection: n.corpus.id,
			expectedDim: n.meta.dim,
			tee: null,
			countBytes: !0,
			onDrained: async () => {
				await a.writeMeta(n.corpus.id, n.meta.commitSha, n.raw), await a.pruneStale(n.corpus.id, n.meta.commitSha);
			}
		});
	}
	async function ne(t, n) {
		let { id: r } = n.corpus, i = n.meta.commitSha;
		e.status = "downloading", u = new AbortController();
		let s;
		try {
			s = await o.openCorpus(n.corpus.gzUrl, u.signal);
		} catch (e) {
			throw g(t), e?.name === "AbortError" ? e : v(_a(e), e);
		}
		s.contentLength !== null && (e.progress.totalBytes += s.contentLength - n.meta.gzBytes);
		let c = s.body.pipeThrough(new TransformStream({ transform(t, n) {
			e.progress.loadedBytes += t.byteLength, n.enqueue(t);
		} })), l = o.gunzip(c);
		if (l === null) throw v("decompress", /* @__PURE__ */ Error("this browser lacks DecompressionStream (gzip) support"));
		if (d = await a.createCorpusWriter(r, i), t.aborted) throw await y(), new Va();
		let f = async () => {
			e.status = "caching";
			let t = d;
			if (d = null, t) try {
				await t.finalize(), await a.writeMeta(r, i, n.raw);
			} catch {
				await t.discard().catch(() => void 0);
			}
			await a.pruneStale(r, i);
		};
		try {
			return await re(t, l, {
				collection: r,
				expectedDim: n.meta.dim,
				tee: d,
				countBytes: !1,
				onDrained: f
			});
		} catch (e) {
			throw await y(), t.aborted || e?.name === "AbortError" ? e : v(ha(e), e);
		}
	}
	async function re(t, r, { collection: a, expectedDim: o, tee: c, countBytes: l, onDrained: u }) {
		let d = r.getReader(), f = new TextDecoder(), p = null, m = [], h = async () => {
			m.length !== 0 && (i.upsert(a, m), e.progress.indexed += m.length, m = [], await s(), g(t));
		}, _ = Ma(async (e) => {
			if (!p) {
				p = Aa(e, o), i.createCollection(a, p.dim);
				return;
			}
			let t = ja(e);
			t && m.push(t), m.length >= n && await h();
		});
		try {
			for (;;) {
				g(t);
				let { done: n, value: r } = await d.read();
				if (n) break;
				c && await c.write(r), l && (e.progress.loadedBytes += r.byteLength), await _.push(f.decode(r, { stream: !0 }));
			}
			await _.push(f.decode()), await _.end();
		} finally {
			d.releaseLock?.();
		}
		if (!p) throw Error("corpus stream ended before a header line");
		return g(t), await u(), g(t), e.status = "indexing", await h(), p;
	}
	return {
		ensureReady: b,
		abortLoad: x,
		accept: S
	};
}
//#endregion
//#region src/state/session.svelte.js
function Wa(e, t) {
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
	}), o = Ua({
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
			let n = await Da(i, o, {
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
			let { kind: t, resetAt: n } = ma(e);
			throw p(t, e, t === "quota" ? { resetAt: n } : {}), e;
		} finally {
			d && r.cancelFrame(d), a.msgPhase = null, a.stream = null;
		}
	}
	return {
		chat: a,
		conversation: ka({
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
function Ga(e) {
	return e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function Ka(e) {
	let t = e;
	return t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s*[\]]+)\)/g, "<a href=\"$2\" rel=\"noopener nofollow\" target=\"_blank\">$1</a>"), t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"), t = t.replace(/\[(\d{1,3})\](?!\()/g, "<sup class=\"cc-cite\">[$1]</sup>"), t;
}
function qa(e) {
	return Ga(e).split(/(`[^`\n]+`)/).map((e) => e.length > 2 && e.startsWith("`") && e.endsWith("`") ? `<code>${e.slice(1, -1)}</code>` : Ka(e)).join("");
}
function Ja(e, t) {
	let n = t ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/, r = e.map((e) => `<li>${qa(e.replace(n, ""))}</li>`).join("");
	return t ? `<ol>${r}</ol>` : `<ul>${r}</ul>`;
}
function Ya(e, t) {
	if (typeof t != "string" || t.trim() === "") throw Error("renderMarkdown: codeLabel must be a non-empty string");
	if (typeof e != "string" || e.length === 0) return "";
	let n = `<pre class="cc-fence" tabindex="0" role="region" aria-label="${Ga(t)}">`, r = e.replace(/\r\n?/g, "\n").split("\n"), i = [], a = [], o = () => {
		if (a.length === 0) return;
		let e = a.every((e) => /^\s*[-*]\s+/.test(e)), t = a.every((e) => /^\s*\d+[.)]\s+/.test(e));
		e ? i.push(Ja(a, !1)) : t ? i.push(Ja(a, !0)) : i.push(`<p>${a.map(qa).join("<br>")}</p>`), a = [];
	};
	for (let e = 0; e < r.length; e++) {
		let t = r[e], s = t.match(/^```([\w+-]*)\s*$/);
		if (s) {
			o();
			let t = s[1], a = [];
			for (e++; e < r.length && !/^```\s*$/.test(r[e]);) a.push(r[e]), e++;
			let c = t ? ` class="language-${t}"` : "";
			i.push(`${n}<code${c}>${Ga(a.join("\n"))}</code></pre>`);
		} else t.trim() === "" ? o() : a.push(t);
	}
	return o(), i.join("");
}
//#endregion
//#region src/ui/ChatMessage.svelte
var Xa = /* @__PURE__ */ J("<p class=\"cm-user\"><span class=\"cm-prompt\" aria-hidden=\"true\">❯</span> </p>"), Za = /* @__PURE__ */ J("<span class=\"cm-count\"> </span>"), Qa = /* @__PURE__ */ J("<button type=\"button\" class=\"cm-think-toggle\"><span class=\"cm-think-time\"> </span> <span class=\"cm-think-sep\" aria-hidden=\"true\">·</span> <span class=\"cm-think-act\"> </span></button>"), $a = /* @__PURE__ */ J("<span class=\"cm-think-label\"> </span>"), eo = /* @__PURE__ */ J("<div class=\"cm-think\"><!> <div class=\"cm-think-clip\"><p class=\"cm-think-text\"> </p></div></div>"), to = /* @__PURE__ */ J("<div class=\"cm-body\"></div>"), no = /* @__PURE__ */ J("<span class=\"cm-src-corpus\"> </span>"), ro = /* @__PURE__ */ J("<a class=\"cm-src\" target=\"_blank\" rel=\"noopener\"><span class=\"cm-src-n\"> </span> <!> <span class=\"cm-src-path\"> </span> <span class=\"cm-src-lines\"> </span> <span class=\"cm-src-pct\"> </span></a>"), io = /* @__PURE__ */ J("<details class=\"cm-sources\"><summary> </summary> <!></details>"), ao = /* @__PURE__ */ J("<article class=\"cm-card cm-print\"><header class=\"cm-head\"><span class=\"cm-title\"> </span> <!></header> <!> <!> <!></article>");
function oo(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => t.live ? t.live.reasoningText : t.message?.reasoning ?? ""), r = /* @__PURE__ */ M(() => t.live ? t.live.answerText : t.message?.text ?? ""), i = /* @__PURE__ */ M(() => t.live ? t.live.reasoningMs : t.message?.reasoningMs ?? 0), a = /* @__PURE__ */ M(() => (G(i) / 1e3).toFixed(1)), o = /* @__PURE__ */ M(() => G(r).length > 0), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ M(() => G(s) ?? !G(o)), l = /* @__PURE__ */ P(null);
	mn(() => {
		G(n), t.live && G(l) && (G(l).scrollTop = G(l).scrollHeight);
	});
	var u = xr(), d = rn(u), f = (e) => {
		var n = Xa(), r = z(R(n), 1, !0);
		k(n), B(() => X(r, t.message.text)), Y(e, n);
	}, p = (e) => {
		var i = ao(), u = R(i), d = R(u), f = R(d, !0);
		k(d);
		var p = z(d, 2), m = (e) => {
			var n = Za(), r = R(n);
			k(n), B(() => X(r, `${t.message.sources.length ?? ""}
          ${(t.message.sources.length === 1 ? t.copy.sourcesOne : t.copy.sourcesMany) ?? ""}`)), Y(e, n);
		};
		Z(p, (e) => {
			t.message?.sources?.length && e(m);
		}), k(u);
		var h = z(u, 2), g = (e) => {
			var r = eo(), i = R(r), u = (e) => {
				var n = Qa(), r = R(n), i = R(r);
				k(r);
				var o = z(r, 4), l = R(o, !0);
				k(o), k(n), B(() => {
					Q(n, "aria-expanded", G(c)), X(i, `${t.copy.trace.reasonedPrefix ?? ""} ${G(a) ?? ""}s`), X(l, G(c) ? t.copy.trace.hide : t.copy.trace.show);
				}), K("click", n, () => F(s, !G(c))), Y(e, n);
			}, d = (e) => {
				var n = $a(), r = R(n, !0);
				k(n), B(() => X(r, t.copy.trace.label)), Y(e, n);
			};
			Z(i, (e) => {
				G(o) ? e(u) : e(d, -1);
			});
			var f = z(i, 2), p = R(f), m = R(p, !0);
			k(p), ai(p, (e) => F(l, e), () => G(l)), k(f), k(r), B(() => {
				Q(r, "data-open", G(c)), X(m, G(n));
			}), Y(e, r);
		};
		Z(h, (e) => {
			G(n) && e(g);
		});
		var _ = z(h, 2), v = (e) => {
			var n = to();
			zr(n, () => Ya(G(r), t.copy.codeLabel), !0), k(n), Y(e, n);
		};
		Z(_, (e) => {
			(G(r) || !t.live) && e(v);
		});
		var y = z(_, 2), b = (e) => {
			var n = io(), r = R(n), i = R(r, !0);
			k(r), Nr(z(r, 2), 17, () => t.message.sources, (e) => e.n, (e, n) => {
				var r = ro(), i = R(r), a = R(i);
				k(i);
				var o = z(i, 2), s = (e) => {
					var t = no(), r = R(t, !0);
					k(t), B(() => X(r, G(n).corpusId)), Y(e, t);
				};
				Z(o, (e) => {
					t.showCorpus && e(s);
				});
				var c = z(o, 2), l = R(c, !0);
				k(c);
				var u = z(c, 2), d = R(u);
				k(u);
				var f = z(u, 2), p = R(f);
				k(f), k(r), B((e) => {
					Q(r, "href", G(n).url), X(a, `[${G(n).n ?? ""}]`), X(l, G(n).path), X(d, `L${G(n).startLine ?? ""}–${G(n).endLine ?? ""}`), X(p, `${e ?? ""}%`);
				}, [() => Math.round(G(n).relevancePct)]), Y(e, r);
			}), k(n), B(() => {
				n.open = t.sourcesOpen, X(i, t.copy.sourcesHeading);
			}), Y(e, n);
		};
		Z(y, (e) => {
			t.message?.sources?.length && e(b);
		}), k(i), B(() => {
			Q(i, "data-streaming", t.live ? G(o) ? "writing" : "thinking" : void 0), X(f, t.copy.answerTag);
		}), Y(e, i);
	};
	Z(d, (e) => {
		t.message?.role === "user" ? e(f) : e(p, -1);
	}), Y(e, u), He();
}
fr(["click"]);
//#endregion
//#region src/ui/ConsentPanel.svelte
var so = /* @__PURE__ */ J("<li class=\"cc-consent-corpus\"><span class=\"cc-consent-name\"> </span><span class=\"cc-consent-size\"> </span></li>"), co = /* @__PURE__ */ J("<li class=\"cc-consent-engine\"><span class=\"cc-consent-name\"> </span><span class=\"cc-consent-size\"> </span></li>"), lo = /* @__PURE__ */ J("<div class=\"cc-panel cc-consent\" role=\"group\" tabindex=\"-1\"><p class=\"cc-load-title\"> </p> <p class=\"cc-consent-lead\"> </p> <ul class=\"cc-consent-list\"><!> <!></ul> <p class=\"cc-consent-total\"> </p> <div class=\"cc-consent-actions\"><button type=\"button\" class=\"cc-consent-accept\"> </button> <button type=\"button\" class=\"cc-consent-decline\"> </button></div></div>");
function uo(e, t) {
	let n = Sr();
	Ve(t, !0);
	let r = /* @__PURE__ */ P(null), i = /* @__PURE__ */ M(() => Fa(t.consent.totalBytes, t.copy)), a = /* @__PURE__ */ M(() => Fa(t.consent.storedBytes, t.copy));
	mn(() => {
		G(r)?.focus();
	});
	var o = lo(), s = R(o), c = R(s, !0);
	k(s);
	var l = z(s, 2), u = R(l, !0);
	k(l);
	var d = z(l, 2), f = R(d);
	Nr(f, 17, () => t.consent.corpora, (e) => e.id, (e, n) => {
		var r = so(), i = R(r), a = R(i, !0);
		k(i);
		var o = z(i), s = R(o, !0);
		k(o), k(r), B((e) => {
			X(a, G(n).id), X(s, e);
		}, [() => Fa(G(n).bytes, t.copy)]), Y(e, r);
	});
	var p = z(f, 2), m = (e) => {
		var n = co(), r = R(n), i = R(r, !0);
		k(r);
		var a = z(r), o = R(a, !0);
		k(a), k(n), B((e) => {
			X(i, t.copy.consent.engine), X(o, e);
		}, [() => Fa(t.consent.wasmBytes, t.copy)]), Y(e, n);
	};
	Z(p, (e) => {
		t.consent.wasmBytes && e(m);
	}), k(d);
	var h = z(d, 2), g = R(h, !0);
	k(h);
	var _ = z(h, 2), v = R(_), y = R(v, !0);
	k(v);
	var b = z(v, 2), x = R(b, !0);
	k(b), k(_), k(o), ai(o, (e) => F(r, e), () => G(r)), B((e, r) => {
		Q(o, "aria-labelledby", `${n}-title`), Q(o, "aria-describedby", `${n}-total`), Q(o, "data-total-bytes", t.consent.totalBytes), Q(s, "id", `${n}-title`), X(c, t.copy.consent.title), X(u, t.copy.consent.lead), Q(h, "id", `${n}-total`), X(g, e), X(y, r), X(x, t.copy.consent.decline);
	}, [() => Na(t.copy.consent.total, {
		download: G(i),
		stored: G(a)
	}), () => Na(t.copy.consent.accept, { size: G(i) })]), K("click", v, function(...e) {
		t.onaccept?.apply(this, e);
	}), K("click", b, function(...e) {
		t.ondecline?.apply(this, e);
	}), Y(e, o), He();
}
fr(["click"]);
//#endregion
//#region src/ui/ErrorCard.svelte
var fo = /* @__PURE__ */ J("<p class=\"cc-error-reset\"> </p>"), po = /* @__PURE__ */ J("<button type=\"button\" class=\"cc-error-paid\"> </button>"), mo = /* @__PURE__ */ J("<div class=\"cc-error\" role=\"alert\"><span class=\"cc-error-tag\"> </span> <p class=\"cc-error-body\"> </p> <!> <div class=\"cc-error-actions\"><!> <button type=\"button\" class=\"cc-error-retry\"> </button></div></div>");
function ho(e, t) {
	Ve(t, !0);
	var n = mo(), r = R(n), i = R(r, !0);
	k(r);
	var a = z(r, 2), o = R(a, !0);
	k(a);
	var s = z(a, 2), c = (e) => {
		var n = fo(), r = R(n, !0);
		k(n), B(() => X(r, t.resetText)), Y(e, n);
	};
	Z(s, (e) => {
		t.resetText && e(c);
	});
	var l = z(s, 2), u = R(l), d = (e) => {
		var n = po(), r = R(n, !0);
		k(n), B(() => X(r, t.paidLabel)), K("click", n, function(...e) {
			t.onpaid?.apply(this, e);
		}), Y(e, n);
	};
	Z(u, (e) => {
		t.paidLabel && e(d);
	});
	var f = z(u, 2), p = R(f, !0);
	k(f), k(l), k(n), B(() => {
		X(i, t.entry.tag), X(o, t.detail ?? t.entry.body), X(p, t.entry.retry);
	}), K("click", f, function(...e) {
		t.onretry?.apply(this, e);
	}), Y(e, n), He();
}
fr(["click"]);
//#endregion
//#region src/ui/KeyRow.svelte
var go = /* @__PURE__ */ J("<span class=\"cc-key-back\"><button type=\"button\" class=\"cc-key-keep\"> </button> <button type=\"button\" class=\"cc-key-forget\"> </button></span>"), _o = /* @__PURE__ */ J("<p class=\"cc-key-forgotten\" role=\"status\"> <button type=\"button\" class=\"cc-key-undo\"> </button></p>"), vo = /* @__PURE__ */ J(" <a class=\"cc-link\" target=\"_blank\" rel=\"noopener\"> </a>", 1), yo = /* @__PURE__ */ J("<div class=\"cc-key\"><div class=\"cc-key-top\"><span class=\"cc-key-tag\"> </span> <!></div> <!> <p class=\"cc-key-lead\"><!></p> <form class=\"cc-key-form\"><input class=\"cc-key-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"button\" class=\"cc-key-toggle\"> </button> <button type=\"submit\" class=\"cc-key-save\"> </button></form></div>"), bo = /* @__PURE__ */ J("<button type=\"button\" class=\"cc-model-reset\"> </button>"), xo = /* @__PURE__ */ J("<div class=\"cc-keyrow\"><span class=\"cc-connected\"><span class=\"cc-connected-dot\" aria-hidden=\"true\"></span> </span> <span class=\"cc-keyrow-note\"> </span> <button type=\"button\" class=\"cc-keyrow-swap\"> </button> <span class=\"cc-model\"><span class=\"cc-model-label\"> </span> <span class=\"cc-model-id\"> </span> <!></span></div>");
function So(e, t) {
	Ve(t, !0);
	let n = oi(t, "convo", 7), r = oi(t, "swapping", 15), i = /* @__PURE__ */ M(() => t.session.chat), a = /* @__PURE__ */ P(!1), o = /* @__PURE__ */ P(null), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ P(null), l = /* @__PURE__ */ M(() => G(i).chatModel === t.session.defaultChatModel), u = /* @__PURE__ */ M(() => r() && G(i).keyState === "set"), d = /* @__PURE__ */ M(() => G(i).keyState === "missing" || G(u));
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
	var g = xr(), _ = rn(g), v = (e) => {
		var r = yo(), s = R(r), l = R(s), d = R(l, !0);
		k(l);
		var g = z(l, 2), _ = (e) => {
			var n = go(), r = R(n), i = R(r, !0);
			k(r);
			var a = z(r, 2), o = R(a, !0);
			k(a), k(n), B(() => {
				X(i, t.copy.key.keep), X(o, t.copy.key.forget);
			}), K("click", r, p), K("click", a, m), Y(e, n);
		};
		Z(g, (e) => {
			G(u) && e(_);
		}), k(s);
		var v = z(s, 2), y = (e) => {
			var n = _o(), r = R(n), i = z(r), a = R(i, !0);
			k(i), ai(i, (e) => F(c, e), () => G(c)), k(n), B(() => {
				X(r, `${t.copy.key.forgotten ?? ""} `), X(a, t.copy.key.undo);
			}), K("click", i, h), Y(e, n);
		};
		Z(v, (e) => {
			G(i).keyForgotten && !G(u) && e(y);
		});
		var b = z(v, 2), x = R(b), S = (e) => {
			var n = br();
			B(() => X(n, t.copy.key.swapLead)), Y(e, n);
		}, ee = (e) => {
			var n = vo(), r = rn(n), i = z(r), a = R(i, !0);
			k(i), B(() => {
				X(r, `${t.copy.key.lead ?? ""} `), Q(i, "href", t.copy.key.url), X(a, t.copy.key.linkText);
			}), Y(e, n);
		};
		Z(x, (e) => {
			G(u) ? e(S) : e(ee, -1);
		}), k(b);
		var te = z(b, 2), C = R(te);
		Zr(C), ai(C, (e) => F(o, e), () => G(o));
		var w = z(C, 2), ne = R(w, !0);
		k(w);
		var re = z(w, 2), ie = R(re, !0);
		k(re), k(te), k(r), B((e) => {
			Q(r, "data-mode", G(u) ? "swap" : "new"), X(d, G(u) ? t.copy.key.swapTag : t.copy.key.tag), Q(C, "type", G(a) ? "text" : "password"), Q(C, "placeholder", t.copy.key.placeholder), Q(C, "aria-label", t.copy.key.inputLabel), Q(w, "aria-pressed", G(a)), X(ne, G(a) ? t.copy.key.conceal : t.copy.key.reveal), re.disabled = e, X(ie, t.copy.key.save);
		}, [() => !n().keyDraft.trim()]), dr("submit", te, f), ti(C, () => n().keyDraft, (e) => n().keyDraft = e), K("click", w, () => F(a, !G(a))), Y(e, r);
	}, y = (e) => {
		var n = xo(), a = R(n), o = z(R(a), 1, !0);
		k(a);
		var c = z(a, 2), u = R(c, !0);
		k(c);
		var d = z(c, 2), f = R(d, !0);
		k(d), ai(d, (e) => F(s, e), () => G(s));
		var p = z(d, 2), m = R(p), h = R(m, !0);
		k(m);
		var g = z(m, 2), _ = R(g, !0);
		k(g);
		var v = z(g, 2), y = (e) => {
			var n = bo(), r = R(n, !0);
			k(n), B(() => X(r, t.copy.model.reset)), K("click", n, () => t.session.resetChatModel()), Y(e, n);
		};
		Z(v, (e) => {
			G(l) || e(y);
		}), k(p), k(n), B(() => {
			X(o, t.copy.key.connectedTag), X(u, t.copy.key.connectedNote), X(f, t.copy.key.change), Q(p, "title", G(i).chatModel), X(h, t.copy.model.label), X(_, G(i).chatModel);
		}), K("click", d, () => r(!0)), Y(e, n);
	};
	Z(_, (e) => {
		G(d) ? e(v) : e(y, -1);
	}), Y(e, g), He();
}
fr(["click"]);
//#endregion
//#region src/ui/LatticeIcon.svelte
var Co = /* @__PURE__ */ yr("<svg class=\"cc-icon\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.5 7.5 12 4M4.5 7.5 12 12M4.5 7.5 12 20M4.5 16.5 12 4M4.5 16.5 12 12M4.5 16.5 12 20M12 4 19.5 7.5M12 12 19.5 7.5M12 20 19.5 7.5M12 4 19.5 16.5M12 12 19.5 16.5M12 20 19.5 16.5\" stroke=\"currentColor\" stroke-width=\"1.2\" stroke-linecap=\"round\" opacity=\"0.6\"></path><g fill=\"currentColor\"><circle cx=\"4.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"4.5\" cy=\"16.5\" r=\"2\"></circle><circle cx=\"12\" cy=\"4\" r=\"2\"></circle><circle cx=\"12\" cy=\"12\" r=\"2\"></circle><circle cx=\"12\" cy=\"20\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"7.5\" r=\"2\"></circle><circle cx=\"19.5\" cy=\"16.5\" r=\"2\"></circle></g></svg>");
function wo(e, t) {
	var n = Co();
	B(() => {
		Q(n, "width", t.size), Q(n, "height", t.size);
	}), Y(e, n);
}
//#endregion
//#region src/core/status.js
var To = Object.freeze([
	"wasm-init",
	"manifest",
	"loading-cached",
	"downloading",
	"caching",
	"indexing"
]), Eo = [
	"manifest",
	"wasm-init",
	"corpus",
	"indexing"
], Do = (e) => (e / 1e6).toFixed(1), Oo = (e) => String(e).slice(0, 7);
function ko(e, t) {
	return Na(e.progress.bytes, {
		loaded: Do(t.loadedBytes),
		total: Do(t.totalBytes)
	});
}
function Ao(e, t) {
	return Na(e.progress.count, {
		done: t.indexed,
		total: t.totalPoints
	});
}
function jo(e, t, n) {
	if (n) return t.phase[e.msgPhase] ?? t.phase.writing;
	if (e.status === "ready" && e.corpora.length > 0) {
		let n = e.corpora.reduce((e, t) => e + t.chunks, 0), r = e.corpora.length === 1 ? Oo(e.corpora[0].commit) : Na(t.pill.corpora, { n: e.corpora.length }), i = [
			t.status.ready,
			r,
			Na(t.pill.chunks, { n }),
			Na(t.pill.dim, { n: e.corpora[0].dim })
		];
		return e.offline && i.push(t.offlineBadge), i.join(" · ");
	}
	return e.status === "downloading" && e.progress.totalBytes > 0 ? `${t.status.downloading} ${ko(t, e.progress)}` : e.status === "indexing" && e.progress.totalPoints > 0 ? `${t.status.indexing} ${Ao(t, e.progress)}` : t.status[e.status] ?? e.status;
}
function Mo(e, t, n) {
	return n || e.status === "ready" ? jo(e, t, n) : t.status[e.status] ?? e.status;
}
function No(e, t) {
	return e.status === "error" ? "error" : e.status === "consent" ? "idle" : e.status === "ready" ? t ? "working" : "ready" : e.status === "idle" ? "idle" : "working";
}
function Po(e, t) {
	let n = e.progress;
	return e.status === "downloading" || e.status === "caching" ? n.totalBytes > 0 ? ko(t, n) : "" : (e.status === "indexing" || e.status === "loading-cached") && n.totalPoints > 0 ? Ao(t, n) : "";
}
function Fo(e, t) {
	let n = [
		"loading-cached",
		"downloading",
		"caching"
	].includes(e.status) ? "corpus" : e.status, r = Eo.indexOf(n);
	return Eo.map((n, i) => ({
		id: n,
		label: t.loader.stages[n],
		state: r === -1 ? "pending" : i < r ? "done" : i === r ? "active" : "pending",
		detail: i === r ? Po(e, t) : ""
	}));
}
function Io(e) {
	let t = e.progress;
	return (e.status === "downloading" || e.status === "caching") && t.totalBytes > 0 ? Math.min(100, t.loadedBytes / t.totalBytes * 100) : (e.status === "indexing" || e.status === "loading-cached") && t.totalPoints > 0 ? Math.min(100, t.indexed / t.totalPoints * 100) : null;
}
//#endregion
//#region src/ui/LoaderPanel.svelte
var Lo = /* @__PURE__ */ J("<div><dt> </dt> <dd> </dd></div>"), Ro = /* @__PURE__ */ J("<dl class=\"cc-load-meta\"><div><dt> </dt> <dd> </dd></div> <!></dl>"), zo = /* @__PURE__ */ J("<span class=\"cc-stage-detail\"> </span>"), Bo = /* @__PURE__ */ J("<li class=\"cc-stage\"><span class=\"cc-stage-glyph\" aria-hidden=\"true\"> </span> <span class=\"cc-stage-label\"> </span> <!></li>"), Vo = /* @__PURE__ */ J("<p class=\"cc-offline\"> </p>"), Ho = /* @__PURE__ */ J("<div class=\"cc-panel cc-load\" aria-busy=\"true\"><p class=\"cc-load-title\"> </p> <!> <ol class=\"cc-stages\"></ol> <div class=\"cc-bar\" role=\"progressbar\" aria-valuemin=\"0\" aria-valuemax=\"100\"><div></div></div> <!> <p class=\"cc-fine\"> </p></div>");
function Uo(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => Fo(t.chat, t.copy)), r = /* @__PURE__ */ M(() => Io(t.chat));
	var i = Ho(), a = R(i), o = R(a, !0);
	k(a);
	var s = z(a, 2), c = (e) => {
		var n = Ro(), r = R(n), i = R(r), a = R(i, !0);
		k(i);
		var o = z(i, 2), s = R(o, !0);
		k(o), k(r);
		var c = z(r, 2), l = (e) => {
			var n = Lo(), r = R(n), i = R(r, !0);
			k(r);
			var a = z(r, 2), o = R(a, !0);
			k(a), k(n), B(() => {
				X(i, t.copy.loader.chunksLabel), X(o, t.chat.progress.totalPoints);
			}), Y(e, n);
		};
		Z(c, (e) => {
			t.chat.progress.totalPoints > 0 && e(l);
		}), k(n), B((e) => {
			X(a, t.copy.loader.sizeLabel), X(s, e);
		}, [() => Na(t.copy.progress.size, { total: Do(t.chat.progress.totalBytes) })]), Y(e, n);
	};
	Z(s, (e) => {
		t.chat.progress.totalBytes > 0 && e(c);
	});
	var l = z(s, 2);
	Nr(l, 21, () => G(n), (e) => e.id, (e, t) => {
		var n = Bo(), r = R(n), i = R(r, !0);
		k(r);
		var a = z(r, 2), o = R(a, !0);
		k(a);
		var s = z(a, 2), c = (e) => {
			var n = zo(), r = R(n, !0);
			k(n), B(() => X(r, G(t).detail)), Y(e, n);
		};
		Z(s, (e) => {
			G(t).detail && e(c);
		}), k(n), B(() => {
			Q(n, "data-state", G(t).state), X(i, G(t).state === "done" ? "✓" : G(t).state === "active" ? "●" : "○"), X(o, G(t).label);
		}), Y(e, n);
	}), k(l);
	var u = z(l, 2), d = R(u);
	let f, p;
	k(u);
	var m = z(u, 2), h = (e) => {
		var n = Vo(), r = R(n, !0);
		k(n), B(() => X(r, t.copy.offlineBadge)), Y(e, n);
	};
	Z(m, (e) => {
		t.chat.offline && e(h);
	});
	var g = z(m, 2), _ = R(g, !0);
	k(g), k(i), B((e) => {
		X(o, t.copy.loader.title), Q(u, "aria-label", t.copy.loader.title), Q(u, "aria-valuenow", e), f = Gr(d, 1, "cc-bar-fill", null, f, { "cc-shimmer": G(r) === null }), p = qr(d, "", p, { width: `${(G(r) === null ? 100 : G(r)) ?? ""}%` }), X(_, t.copy.loader.cancelNote);
	}, [() => G(r) === null ? void 0 : Math.round(G(r))]), Y(e, i), He();
}
//#endregion
//#region src/ui/focus-trap.js
var Wo = "a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])";
function Go(e) {
	return [...e.querySelectorAll(Wo)].filter((e) => e.offsetParent !== null);
}
function Ko(e, t) {
	if (e.key !== "Tab" || e.ctrlKey || e.metaKey) return !1;
	let n = Go(t);
	if (n.length === 0) return !1;
	let r = document.activeElement, i = (e) => !!(r && r !== e && r.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING), a = (e) => !!(r && r !== e && e.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING && !e.contains(r)), o = r && t.contains(r), s;
	return e.shiftKey ? (s = o ? n.findLast(a) : void 0, s ??= n[n.length - 1]) : (s = o ? n.find(i) : void 0, s ??= n[0]), e.preventDefault(), s.focus(), !0;
}
//#endregion
//#region src/core/reset-time.js
function qo(e, t, n, { locale: r, timeZone: i }) {
	let a = new Date(e).toLocaleTimeString(r, {
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
		timeZone: i
	}), o = Math.ceil((e - t) / 6e4);
	if (o <= 0) return `${n.errors.quota.reset} ${a}.`;
	let s = Na(n.errors.quota.resetIn, {
		h: Math.floor(o / 60),
		m: o % 60
	});
	return `${n.errors.quota.reset} ${a}, ${s}.`;
}
//#endregion
//#region src/ui/RepoChat.svelte
var Jo = /* @__PURE__ */ J("<div class=\"cc-motif\" aria-hidden=\"true\"></div>"), Yo = /* @__PURE__ */ J("<div class=\"cc-panel\"><!></div>"), Xo = /* @__PURE__ */ J("<p class=\"cc-offline\"> </p>"), Zo = /* @__PURE__ */ J("<p class=\"cc-cleared\" role=\"status\"> <button type=\"button\" class=\"cc-undo\"> </button></p>"), Qo = /* @__PURE__ */ J("<p class=\"cc-boot-line\"> </p>"), $o = /* @__PURE__ */ J("<p class=\"cc-boot-line cc-boot-corpus\"> </p>"), es = /* @__PURE__ */ J("<button type=\"button\" class=\"cc-chip\"> </button>"), ts = /* @__PURE__ */ J("<!> <p class=\"cc-sub\"> </p> <div class=\"cc-boot\"><!> <!></div> <div class=\"cc-chips\"></div>", 1), ns = /* @__PURE__ */ J("<p class=\"cc-pending\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-pending-bar cc-shimmer\" aria-hidden=\"true\"></span></p>"), rs = /* @__PURE__ */ J("<div class=\"cc-log\" role=\"log\" aria-live=\"polite\" tabindex=\"-1\"><!> <!> <!> <!> <!></div>"), is = /* @__PURE__ */ J("<button type=\"button\" class=\"cc-clear\"> </button>"), as = /* @__PURE__ */ J("<div class=\"cc-backdrop\" role=\"presentation\"><div class=\"cc\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\"><!> <header class=\"cc-head\"><div class=\"cc-head-titles\"><span class=\"cc-slabel\"><!> </span> <h2 class=\"cc-title\"> </h2></div> <p class=\"cc-status\"><span class=\"cc-status-dot\" aria-hidden=\"true\"></span> <span class=\"cc-status-text\"> </span></p> <p class=\"cc-sr\" role=\"status\"> </p> <button type=\"button\" class=\"cc-close\">✕</button></header> <!> <!> <form class=\"cc-input-row\"><span class=\"cc-prompt\" aria-hidden=\"true\">❯</span> <input class=\"cc-input\" autocomplete=\"off\" spellcheck=\"false\"/> <button type=\"submit\" class=\"cc-ask\"> </button></form> <div class=\"cc-foot\"><!> <span class=\"cc-hint\" aria-live=\"polite\"><!></span> <span class=\"cc-fineprint\"> </span></div></div></div>");
function os(e, t) {
	Ve(t, !0);
	let n = /* @__PURE__ */ M(() => t.session.chat), r = /* @__PURE__ */ M(() => t.session.conversation), i = /* @__PURE__ */ M(() => G(r).convo), a = /* @__PURE__ */ P(null), o = /* @__PURE__ */ P(null), s = /* @__PURE__ */ P(null), c = /* @__PURE__ */ P(!1), l = /* @__PURE__ */ M(() => To.includes(G(n).status) || G(n).status === "idle"), u = /* @__PURE__ */ M(() => G(n).status === "ready"), d = /* @__PURE__ */ M(() => G(n).status === "error" ? G(n).error : null), f = /* @__PURE__ */ M(() => G(n).status === "consent" ? G(n).consent : null), p = /* @__PURE__ */ M(() => G(r).canAsk()), m = /* @__PURE__ */ M(() => jo(G(n), t.copy, G(i).asking)), h = /* @__PURE__ */ M(() => Mo(G(n), t.copy, G(i).asking)), g = /* @__PURE__ */ M(() => No(G(n), G(i).asking)), _ = /* @__PURE__ */ M(() => G(i).askError), v = /* @__PURE__ */ M(() => G(_)?.kind === "quota" && G(_).resetAt ? qo(G(_).resetAt, t.session.epochMs(), t.copy, {
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
		(To.includes(G(n).status) || G(n).status === "consent") && t.session.abortLoad(), t.onclose();
	}
	async function te() {
		t.session.acceptDownload(), await tr(), G(a)?.focus();
	}
	function C(e) {
		e.key === "Escape" ? ee() : G(a) && Ko(e, G(a));
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
	var ue = as();
	dr("keydown", Zt, C);
	var de = R(ue), fe = R(de), pe = (e) => {
		var n = Jo();
		zr(n, () => t.brand.motifSvg, !0), k(n), Y(e, n);
	};
	Z(fe, (e) => {
		t.brand.motifSvg && e(pe);
	});
	var me = z(fe, 2), he = R(me), ge = R(he), _e = R(ge);
	wo(_e, { size: 14 });
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
		var t = Yo(), n = R(t);
		{
			let e = /* @__PURE__ */ M(() => G(d).kind === "config" ? G(d).message : null);
			ho(n, {
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
		k(t), Y(e, t);
	}, Oe = (e) => {
		uo(e, {
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
		Uo(e, {
			get chat() {
				return G(n);
			},
			get copy() {
				return t.copy;
			}
		});
	}, Ae = (e) => {
		var r = rs(), a = R(r), o = (e) => {
			var n = Xo(), r = R(n, !0);
			k(n), B(() => X(r, t.copy.offlineBadge)), Y(e, n);
		};
		Z(a, (e) => {
			G(n).offline && e(o);
		});
		var c = z(a, 2), l = (e) => {
			var r = ts(), a = rn(r), o = (e) => {
				var n = Zo(), r = R(n), i = z(r), a = R(i, !0);
				k(i), k(n), B(() => {
					X(r, `${t.copy.conversation.cleared ?? ""} `), X(a, t.copy.conversation.undo);
				}), K("click", i, ce), Y(e, n);
			};
			Z(a, (e) => {
				G(i).cleared && e(o);
			});
			var s = z(a, 2), c = R(s, !0);
			k(s);
			var l = z(s, 2), u = R(l);
			Nr(u, 17, () => t.copy.boot, kr, (e, t) => {
				var n = Qo(), r = R(n, !0);
				k(n), B(() => X(r, G(t))), Y(e, n);
			}), Nr(z(u, 2), 17, () => G(n).corpora, (e) => e.id, (e, n) => {
				var r = $o(), i = R(r, !0);
				k(r), B((e) => X(i, e), [() => Na(t.copy.corpusLine, {
					id: G(n).id,
					chunks: G(n).chunks,
					files: G(n).files,
					commit: Oo(G(n).commit)
				})]), Y(e, r);
			}), k(l);
			var d = z(l, 2);
			Nr(d, 21, () => t.copy.starters, kr, (e, t) => {
				var n = es(), r = R(n, !0);
				k(n), B(() => X(r, G(t))), K("click", n, (e) => ie(G(t), e)), Y(e, n);
			}), k(d), B(() => X(c, t.copy.sub)), Y(e, r);
		};
		Z(c, (e) => {
			G(i).messages.length === 0 && e(l);
		});
		var u = z(c, 2);
		Nr(u, 17, () => G(x), (e) => e.id, (e, r) => {
			{
				let i = /* @__PURE__ */ M(() => G(r).live ? null : G(r)), a = /* @__PURE__ */ M(() => G(r).live ?? null), o = /* @__PURE__ */ M(() => G(n).corpora.length > 1);
				oo(e, {
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
			var r = ns(), i = z(R(r));
			Pe(), k(r), B(() => X(i, ` ${t.copy.phase[G(n).msgPhase] ?? t.copy.phase.writing ?? ""} `)), Y(e, r);
		};
		Z(d, (e) => {
			!G(b) && G(i).asking && e(f);
		});
		var p = z(d, 2), m = (e) => {
			{
				let n = /* @__PURE__ */ M(() => G(_).kind === "quota" && G(y) ? t.copy.errors.quota.paid : "");
				ho(e, {
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
		Z(p, (e) => {
			G(_) && e(m);
		}), k(r), ai(r, (e) => F(s, e), () => G(s)), B(() => {
			Q(r, "aria-label", t.copy.conversation.label), Q(r, "aria-busy", G(i).asking);
		}), Y(e, r);
	};
	Z(Ee, (e) => {
		G(d) ? e(De) : G(f) ? e(Oe, 1) : G(l) ? e(ke, 2) : e(Ae, -1);
	});
	var je = z(Ee, 2);
	So(je, {
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
	Zr(Me), ai(Me, (e) => F(o, e), () => G(o));
	var D = z(Me, 2), O = R(D, !0);
	k(D), k(E);
	var Ne = z(E, 2), Fe = R(Ne), Ie = (e) => {
		var n = is(), r = R(n, !0);
		k(n), B(() => X(r, t.copy.conversation.clear)), K("click", n, se), Y(e, n);
	};
	Z(Fe, (e) => {
		G(i).messages.length > 0 && !G(i).asking && e(Ie);
	});
	var Le = z(Fe, 2), Re = R(Le), ze = (e) => {
		var n = br();
		B(() => X(n, t.copy.input.hintLoading)), Y(e, n);
	}, A = (e) => {
		var n = br();
		B(() => X(n, t.copy.input.hintNoKey)), Y(e, n);
	};
	Z(Re, (e) => {
		!G(u) && !G(d) && !G(f) ? e(ze) : G(n).keyState === "missing" && e(A, 1);
	}), k(Le);
	var Be = z(Le, 2), Ue = R(Be, !0);
	k(Be), k(Ne), k(de), ai(de, (e) => F(a, e), () => G(a)), k(ue), B((e) => {
		Q(de, "aria-label", t.copy.navLabel), X(ve, t.copy.label), X(be, t.copy.title), Q(xe, "data-tone", G(g)), Q(xe, "title", G(m)), X(Ce, G(m)), X(Te, G(h)), Q(T, "aria-label", t.copy.closeLabel), Q(Me, "placeholder", t.copy.input.placeholder), Q(Me, "aria-label", t.copy.navLabel), Me.disabled = !G(u), D.disabled = e, X(O, t.copy.input.ask), X(Ue, t.copy.input.fine);
	}, [() => !G(p) || !G(i).draft.trim()]), K("click", ue, ee), K("click", de, (e) => e.stopPropagation()), K("click", T, ee), dr("submit", E, re), ti(Me, () => G(i).draft, (e) => G(i).draft = e), K("click", D, (e) => ne = e), Y(e, ue), He();
}
fr(["click"]);
//#endregion
//#region src/index.js
var ss = "(max-width: 860px)", cs = /* @__PURE__ */ new Map(), ls = (e) => `${e.storage.keyPrefix}lattice-wasm`;
function us(e) {
	return JSON.stringify([
		e.corpora,
		e.wasm,
		e.provider,
		e.retrieval,
		e.storage.keyPrefix,
		e.brand.productName
	]);
}
function ds(e) {
	let t = us(e), n = cs.get(t);
	if (!n) {
		let r = {
			fetch: Li,
			sleep: Pi
		};
		n = Wa(e, {
			openrouter: oa(e.provider, r),
			lattice: Ji(e.wasm, {
				importModule: Ri,
				fetch: Li
			}),
			cache: fa(e.storage.keyPrefix, { getDirectory: zi() }),
			net: Ki({ fetch: Li }),
			keys: pa(e.storage.keyPrefix, window.localStorage),
			clock: Fi,
			idleYield: Ni,
			wasmBytes: () => Hi(e.wasm.binUrl, ls(e))
		}), cs.set(t, n);
	}
	return n;
}
function fs(e) {
	if (typeof window > "u" || typeof document > "u") throw Error(`${e} runs in a browser only`);
}
function ps(e) {
	let t = Mi(e);
	fs("warmRepoChat"), Bi(t.assets.cssHref).catch(() => {}), Wi(t.wasm.binUrl, ls(t));
}
function ms(e) {
	let t = Mi(e);
	fs("openRepoChat");
	let n = document.createElement("div");
	n.className = "arr-root";
	for (let [e, r] of di(t.theme)) n.style.setProperty(e, r);
	let r, i = new Promise((e, t) => {
		r = {
			resolve: e,
			reject: t
		};
	});
	i.catch(() => {});
	let a = null, o = !1, s = !1;
	function c() {
		s || (s = !0, l.abortLoad(), a && Dr(a), n.remove(), o || r.reject(/* @__PURE__ */ Error("the chat was closed before its corpora were ready")), t.onClose?.());
	}
	let l = ds(t);
	return t.mount.appendChild(n), Bi(t.assets.cssHref).catch((e) => {
		console.error(e);
	}).then(() => {
		s || (a = Cr(os, {
			target: n,
			props: {
				session: l,
				copy: t.copy,
				brand: t.brand,
				sourcesOpen: !Ii(ss),
				reducedMotion: () => Ii("(prefers-reduced-motion: reduce)"),
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
export { ci as COPY_EN, fi as ConfigError, ms as openRepoChat, ps as warmRepoChat };
