var Mustache = function() {

    var a = {};
    var b = function() {};
    b.prototype = {
        otag: "{{",
        ctag: "}}",
        pragmas: {},
        buffer: [],
        pragmas_implemented: {
            "IMPLICIT-ITERATOR": true
        },
        context: {},
        render: function(f, e, d, g) {
            if (!g) {
                this.context = e;
                this.buffer = []
            }
            if (!this.includes("", f)) {
                if (g) {
                    return f
                } else {
                    this.send(f);
                    return
                }
            }
            f = this.render_pragmas(f);
            var c = this.render_section(f, e, d);
            if (c === false) {
                c = this.render_tags(f, e, d, g)
            }
            if (g) {
                return c
            } else {
                this.sendLines(c)
            }
        },
        send: function(c) {
            if (c !== "") {
                this.buffer.push(c)
            }
        },
        sendLines: function(e) {
            if (e) {
                var c = e.split("\n");
                for (var d = 0; d < c.length; d++) {
                    this.send(c[d])
                }
            }
        },
        render_pragmas: function(c) {
            if (!this.includes("%", c)) {
                return c
            }
            var e = this;
            var d = this.getCachedRegex("render_pragmas",
            function(g, f) {
                return new RegExp(g + "%([\\w-]+) ?([\\w]+=[\\w]+)?" + f, "g")
            });
            return c.replace(d,
            function(h, f, g) {
                if (!e.pragmas_implemented[f]) {
                    throw ({
                        message: "This implementation of mustache doesn't understand the '" + f + "' pragma"
                    })
                }
                e.pragmas[f] = {};
                if (g) {
                    var i = g.split("=");
                    e.pragmas[f][i[0]] = i[1]
                }
                return ""
            })
        },
        render_partial: function(c, e, d) {
            c = this.trim(c);
            if (!d || d[c] === undefined) {
                throw ({
                    message: "unknown_partial '" + c + "'"
                })
            }
            if (typeof(e[c]) != "object") {
                return this.render(d[c], e, d, true)
            }
            return this.render(d[c], e[c], d, true)
        },
        render_section: function(e, d, c) {
            if (!this.includes("#", e) && !this.includes("^", e)) {
                return false
            }
            var g = this;
            var f = this.getCachedRegex("render_section",
            function(i, h) {
                return new RegExp("^([\\s\\S]*?)" + i + "(\\^|\\#)\\s*(.+)\\s*" + h + "\n*([\\s\\S]*?)" + i + "\\/\\s*\\3\\s*" + h + "\\s*([\\s\\S]*)$", "g")
            });
            return e.replace(f,
            function(k, o, n, j, l, i) {
                var q = o ? g.render_tags(o, d, c, true) : "",
                m = i ? g.render(i, d, c, true) : "",
                h,
                p = g.find(j, d);
                if (n === "^") {
                    if (!p || g.is_array(p) && p.length === 0) {
                        h = g.render(l, d, c, true)
                    } else {
                        h = ""
                    }
                } else {
                    if (n === "#") {
                        if (g.is_array(p)) {
                            h = g.map(p,
                            function(r) {
                                return g.render(l, g.create_context(r), c, true)
                            }).join("")
                        } else {
                            if (g.is_object(p)) {
                                h = g.render(l, g.create_context(p), c, true)
                            } else {
                                if (typeof p === "function") {
                                    h = p.call(d, l,
                                    function(r) {
                                        return g.render(r, d, c, true)
                                    })
                                } else {
                                    if (p) {
                                        h = g.render(l, d, c, true)
                                    } else {
                                        h = ""
                                    }
                                }
                            }
                        }
                    }
                }
                return q + h + m
            })
        },
        render_tags: function(l, c, e, g) {
            var f = this;
            var k = function() {
                return f.getCachedRegex("render_tags",
                function(n, i) {
                    return new RegExp(n + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" + i + "+", "g")
                })
            };
            var h = k();
            var j = function(o, i, n) {
                switch (i) {
                case "!":
                    return "";
                case "=":
                    f.set_delimiters(n);
                    h = k();
                    return "";
                case ">":
                    return f.render_partial(n, c, e);
                case "{":
                    return f.find(n, c);
                default:
                    return f.escape(f.find(n, c))
                }
            };
            var m = l.split("\n");
            for (var d = 0; d < m.length; d++) {
                m[d] = m[d].replace(h, j, this);
                if (!g) {
                    this.send(m[d])
                }
            }
            if (g) {
                return m.join("\n")
            }
        },
        set_delimiters: function(d) {
            var c = d.split(" ");
            this.otag = this.escape_regex(c[0]);
            this.ctag = this.escape_regex(c[1])
        },
        escape_regex: function(d) {
            if (!arguments.callee.sRE) {
                var c = ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\"];
                arguments.callee.sRE = new RegExp("(\\" + c.join("|\\") + ")", "g")
            }
            return d.replace(arguments.callee.sRE, "\\$1")
        },
        find: function(e, f) {
            e = this.trim(e);
            function d(h) {
                return h === false || h === 0 || h
            }
            var g;
            if (e.match(/([a-z_]+)\./ig)) {
                var c = this.walk_context(e, f);
                if (d(c)) {
                    g = c
                }
            } else {
                if (d(f[e])) {
                    g = f[e]
                } else {
                    if (d(this.context[e])) {
                        g = this.context[e]
                    }
                }
            }
            if (typeof g === "function") {
                return g.apply(f)
            }
            if (g !== undefined) {
                return g
            }
            return ""
        },
        walk_context: function(c, d) {
            var g = c.split(".");
            var f = (d[g[0]] != undefined) ? d: this.context;
            var e = f[g.shift()];
            while (e != undefined && g.length > 0) {
                f = e;
                e = e[g.shift()]
            }
            if (typeof e === "function") {
                return e.apply(f)
            }
            return e
        },
        includes: function(d, c) {
            return c.indexOf(this.otag + d) != -1
        },
        escape: function(c) {
            c = String(c === null ? "": c);
            return c.replace(/&(?!\w+;)|["'<>\\]/g,
            function(d) {
                switch (d) {
                case "&":
                    return "&amp;";
                case '"':
                    return "&quot;";
                case "'":
                    return "&#39;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                default:
                    return d
                }
            })
        },
        create_context: function(d) {
            if (this.is_object(d)) {
                return d
            } else {
                var e = ".";
                if (this.pragmas["IMPLICIT-ITERATOR"]) {
                    e = this.pragmas["IMPLICIT-ITERATOR"].iterator
                }
                var c = {};
                c[e] = d;
                return c
            }
        },
        is_object: function(c) {
            return c && typeof c == "object"
        },
        is_array: function(c) {
            return Object.prototype.toString.call(c) === "[object Array]"
        },
        trim: function(c) {
            return c.replace(/^\s*|\s*$/g, "")
        },
        map: function(g, e) {
            if (typeof g.map == "function") {
                return g.map(e)
            } else {
                var f = [];
                var c = g.length;
                for (var d = 0; d < c; d++) {
                    f.push(e(g[d]))
                }
                return f
            }
        },
        getCachedRegex: function(d, g) {
            var f = a[this.otag];
            if (!f) {
                f = a[this.otag] = {}
            }
            var c = f[this.ctag];
            if (!c) {
                c = f[this.ctag] = {}
            }
            var e = c[d];
            if (!e) {
                e = c[d] = g(this.otag, this.ctag)
            }
            return e
        }
    };
    return ({
        name: "mustache.js",
        version: "0.5.0-dev",
        to_html: function(e, c, d, g) {
            var f = new b();
            if (g) {
                f.send = g
            }
            f.render(e, c || {},
            d);
            if (!g) {
                return f.buffer.join("\n")
            }
        }
    })
} ();

Array.prototype.indexOf = Array.prototype.indexOf ||
function(d) {
    var b = -1;
    for (var c = 0, a = this.length; c < a; c++) {
        if (this[c] === d) {
            return c
        }
    }
    return b
};

String.prototype.lastChar = function() {
    return this.charAt(this.length - 1)
};



(function(h) {
    var u, o, v = 140,
    w = 0,
    m = 0,
    g = "",
    b = "",
    k = '<div id="db-tagsug-list" class="suggest-overlay"></div>',
    e = h(document.body),
    r = / /g,
    q = /</g,
    x = />/g,
    t = /<\/?code>/g,
    i = /<(\/|\\\/)?b>/g,
    a = /(\\|\+|\:|\*|\/|\||\$|\?|\^|\[|\]|\(|\)\.)/g,
    p = h.browser.version < 7 ? "&nbsp;": "x",
    l = h.browser.msie && h.browser.version < 9;
    function c(B) {
        return B.replace(i, "")
    }
    function f(C) {
        f = null;
        var B = {
            position: "absolute",
            left: -9999,
            width: C.width() + "px",
            "font-family": C.css("font-family"),
            "font-size": C.css("font-size"),
            "word-wrap": "break-word",
            border: "1px"
        };
        u = h("<pre id='douban_pre'></pre>").css(B).appendTo("body")
    }
    var y = {
        highlight: function(F, C, D) {
            D = D || "@";
            var B = [];
            for (var E in F) {
                B.push([E, F[E]])
            }
            B.sort(function(H, G) {
                return H[0].length < G[0].length
            });
            h.each(B,
            function(I, J) {
                var G = J[0];
                var H = J[1];
                if (l) {
                    G = G.replace(r, "&nbsp;")
                }
                C = C.replace(new RegExp(D + G.replace(a, "\\$1"), "g"), '<code data-id="' + H + '">' + D + G + "</code>")
            });
            return C
        },
        escape_html: function(B) {
            return B.replace(q, "&lt;").replace(x, "&gt;")
        },
        moveSelectedItem: function(D, B) {
            var C = o.find("li");
            var E = C.length;
            if (!E) {
                return
            }
            if (!B) {
                B = o.find(".on").index();
                B += D;
                if (B >= E) {
                    B -= E
                }
                if (B < 0) {
                    if (B === -2) {
                        B = -1
                    }
                    B += E
                }
            }
            C.removeClass("on");
            h(C[B]).addClass("on").find("a").focus()
        },
        getCursorPosition: function(C) {
            if (document.selection) {
                var F = C.value;
                var D = C._saved_range || document.selection.createRange();
                var E = C.createTextRange();
                var H = E.duplicate();
                H.moveToBookmark(D.getBookmark());
                E.setEndPoint("EndToStart", H);
                if (D == null || E == null) {
                    return F.length
                }
                var G = D.text.replace(/[\r\n]/g, ".");
                var B = F.replace(/[\r\n]/g, ".");
                return B.indexOf(G, E.text.length)
            } else {
                return C.selectionStart
            }
        },
        setCursorPosition: function(B, C) {
            this.selectRangeText(B, C, C)
        },
        selectRangeText: function(C, D, E) {
            if (document.selection) {
                var B = C.createTextRange();
                B.moveEnd("character", -C.value.length);
                B.moveEnd("character", E);
                B.moveStart("character", D);
                B.select()
            } else {
                C.focus();
                C.setSelectionRange(D, E)
            }
        }
    };
    function z(B, D) {
        var C = this;
        C.elem = B;
        C.options = D;
        C.tagged = {};
        C.init(D);
        return C
    }
    z.prototype = {
        on: function(B, D) {
            var C = this;
            B = B + C.uuid;
            C.node.bind(B,
            function(F, E) {
                E = [F].concat(E);
                D.apply(C, E)
            })
        },
        emit: function(B) {
            var C = arguments;
            B = B + this.uuid;
            data = Array.prototype.slice.call(C, 1);
            this.node.trigger(B, data)
        },
        init: function(C) {
            m++;
            var B = this;
            B.url = C.url;
            if (C.max) {
                B.url = B.url.replace("{max}", C.max)
            }
            var E = B.elem;
            var D = h(E);
            var F = true;
            B.uuid = h.uuid++;
            B.node = D;
            D.bind("keyup input propertychange",
            function(M) {
                if (M.type == "propertychange" && M.originalEvent.propertyName !== "value") {
                    return
                }
                var J = this;
                if (J._closed) {
                    return B.clearHighligher()
                }
                var O = !M.keyCode;
                if (O && !J._from_change) {
                    J._from_change = true;
                    return
                }
                if (O) {
                    J._from_change = true
                } else {
                    J._from_change = false
                }
                var Q = B._slices = B.slices();
                var I = Q[0];
                var L = Q[4];
                var H = I.indexOf(B.options.leadChar) == -1;
                var N = (H && B._highlighted) || (!H && F);
                if (L < I.length + 1 && N) {
                    B.updateHighlight()
                }
                if (!H && (O || [38, 40, 13, 16, 9].indexOf(M.keyCode) == -1)) {
                    if (B.options.delay) {
                        B.clearTimeout();
                        B._t_query = setTimeout(function() {
                            Q = B._slices = B.slices();
                            B.query(Q)
                        },
                        B.options.delay)
                    } else {
                        B.query(Q)
                    }
                }
                if (H) {
                    setTimeout(function() {
                        if (!m) {
                            B.hideSug()
                        }
                    },
                    200);
                    m--
                } else {
                    m++
                }
                if (O) {
                    return
                }
                var G = (M.keyCode === 9 || M.keyCode === 13);
                var P = o && o.find(".on");
                var K = P.length && o.is(":visible");
                if (G && K) {
                    B.choose(P, Q)
                }
            });
            D.bind("keydown",
            function(I) {
                var H = I.keyCode;
                var K = [16, 17, 18, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 144].indexOf(H) != -1;
                if (K || (I.ctrlKey || I.metaKey) && H === 65 || I.shiftKey && (H === 37 || H === 39)) {
                    F = false
                } else {
                    F = true
                }
                if (H == 8) {
                    var J = B.slices();
                    var G = J[2];
                    if (G && G in B.tagged) {
                        E.value = J[1] + J[3];
                        delete B.tagged[G];
                        B.setCursor(J[4] - G.length - 1)
                    }
                    B.hideSug();
                    return
                }
            });
            if (!D[0]._sug_ev_binded) {
                D.bind("keydown",
                function(H) {
                    if (!o || !o.is(":visible") || !o.find("ul").length) {
                        return
                    }
                    switch (H.keyCode) {
                    case 32:
                        B.hideSug();
                        break;
                    case 38:
                        H.preventDefault();
                        y.moveSelectedItem( - 1);
                        break;
                    case 40:
                        H.preventDefault();
                        y.moveSelectedItem(1);
                        break;
                    case 9:
                        H.preventDefault();
                        break;
                    case 13:
                        H.preventDefault();
                        var G = o.find("li.on").find("a")[0];
                        if (G && !G.id && G.href) {
                            G.click()
                        }
                        break
                    }
                });
                D[0]._sug_ev_binded = true
            }
        },
        clearTimeout: function() {
            try {
                clearTimeout(this._t_query)
            } catch(B) {}
        },
        slices: function() {
            var I = this,
            D = I.elem,
            C = D.value,
            F = I.getCursor(),
            G = C.slice(0, F),
            H = C.slice(F),
            B = G.lastIndexOf(this.options.leadChar);
            if (B == -1) {
                return [C, G, null, H, F]
            }
            var E = G.slice(0, B),
            J = G.slice(B + 1);
            return [C, E, J, H, F]
        },
        getCursor: function() {
            return y.getCursorPosition(this.elem)
        },
        setCursor: function(B) {
            return y.setCursorPosition(this.elem, B)
        },
        updateHighlight: function() {
            var D = this;
            if (!D.options.highlight) {
                return
            }
            var F = D.elem;
            var B = y.escape_html(F.value);
            if (l) {
                B = B.replace(r, p)
            }
            var C = y.highlight(D.tagged, B, D.options.leadChar);
            if (C != B) {
                D._highlighted = true
            } else {
                D._highlighted = false
            }
            var E = h(D.options.highlighter);
            E.html(C);
            E.css("marginTop", -F.scrollTop)
        },
        cleanVal: function(F) {
            var D = F || "";
            var B = this.tagged;
            var C;
            var E = [];
            for (C in B) {
                E.push(C.replace(a, "\\$1"))
            }
            if (!E.length) {
                return D
            }
            E.sort(function(H, G) {
                return H.length < G.length
            });
            E = E.join("|");
            D = D.replace(new RegExp("@(" + E + ")", "g"),
            function(H, G) {
                return "@" + B[G]
            });
            return D
        },
        choose: function(I, H) {
            var J = this;
            J.hideSug();
            var E = J.elem;
            var D = E.value;
            if (!I) {
                I = o.find(".on")
            }
            if (!H) {
                H = J._slices || J.slices()
            }
            var K = H[2] || "";
            var G = c(I.attr("data-id") || I.attr("id"));
            if (!G) {
                return
            }
            var C = G;
            if (!J.options.useUid) {
                C = h.trim(I.text().split("(")[0]);
                if (C.indexOf(J.options.leadChar) > -1 || o.text().split(C + "(").length > 3) {
                    C = G
                }
            }
            J.emit("choose", C, G);
            var B = this.tagged;
            B[C] = c(G);
            E.value = H[1] + J.options.leadChar + C + " " + H[3];
            var F = H[4] - K.length + C.length + 1;
            J.setCursor(F);
            J.updateHighlight();
            J._is_waiting = false
        },
        showSug: function(D) {
            var B = this;
            if (!D) {
                B.hideSug();
                return B
            }
            if ("_autocomplete" in B) {
                B._autocomplete = B.node.attr("autocomplete")
            }
            B.node.attr("autocomplete", "off");
            var C = (typeof D == "string") ? '<div class="bd">' + D + "</div>": Mustache.to_html(this.options.listTmpl || "", D);
            o.crtApi = this;
            B.emit("show", D);
            s(C, B.getSugPos());
            if (!o.find("li").hasClass("on")) {
                o.find("li:first").addClass("on")
            }
            return B
        },
        hideSug: function() {
            var B = this;
            B.node.attr("autocomplete", B._autocomplete);
            B.emit("hide");
            A();
            return B
        },
        query: function(I) {
            var J = this;
            var L = J.options;
            var D = J.elem;
            if (!I) {
                I = J.slices()
            }
            var C = I[0];
            var M = I[2];
            J._anterior_txt = I[1] + (M || "");
            var K = L.customData;
            var E = L.mode;
            var G = L.max;
            var H = L.listTmpl;
            var B = L.arrName;
            if (M === null || M.length > J.options.wordLimit || M.indexOf(" ") != -1) {
                return J.hideSug()
            }
            if (typeof K == "function") {
                K = K()
            }
            if (M === "") {
                var F = K && K[B];
                if (!F || !F.length) {
                    return J.showSug(J.options.tips)
                }
                return J.showSug(K)
            }
            K && (K.q = M);
            if (!J.url) {
                return J.showSug(K)
            }
            J.emit("query", M);
            J._is_waiting = true;
            h.getJSON(J.url + encodeURIComponent(M),
            function(P) {
                if (!J._is_waiting) {
                    return
                }
                if (!P) {
                    P = {}
                }
                if (!P[B]) {
                    P[B] = []
                }
                var O = P[B];
                var N = O[0];
                var Q = {};
                if (N && (N.uid || N.id)) {
                    h.each(O,
                    function(R, S) {
                        var T = S.id = (S.id || c(S.uid));
                        T && (Q[T] = 1)
                    })
                }
                if (O.length < G && typeof L.customData == "function") {
                    O = P[B] = O.concat(L.customData(M, G - O.length, Q)[B])
                }
                if (!O.length) {
                    return J.hideSug()
                }
                J.showSug(P)
            })
        },
        getSugPos: function() {
            var C = this;
            var B = C._anterior_txt;
            B = y.escape_html(B);
            var D = h(C.elem);
            nodePos = D.offset(),
            dot = h("<em>&nbsp;</em>"),
            pos = {};
            f && f(D);
            if (l) {
                B = B.replace(r, p)
            }
            u.html(B).append(dot);
            pos = dot.position();
            var E = C.options.sugOffset;
            return {
                marginLeft: D.css("paddingLeft"),
                marginTop: D.css("paddingTop"),
                top: pos.top + nodePos.top + E.top,
                left: pos.left + nodePos.left + E.left
            }
        }
    };
    var n = {
        mode: "complete",
        wordLimit: 8,
        // url: "https://api.douban.com/shuo/in/complete?alt=xd&count={max}&callback=?&word=",
        // url : null,
        url : '/api?count=5&word=',
        max: 10,
        delay: 200,
        customData: null,
        highlight: false,
        highlighter: ".tag-sug-hi",
        sugOffset: {
            top: 21,
            left: -2
        },
        listTmpl: '<ul class="{{cls}}">{{#users}}<li data-id="{{{uid}}}"><a href="http://www.douban.com/people/{{id}}"><img src="{{{avatar}}}">{{{username}}}&nbsp;<span>({{{uid}}})</span></a></li>{{/users}}</ul>',
        arrName: "users",
        leadChar: "@",
        haltLink: true,
        tips: "@某人，ta能收到你的信息"
    };
    h.fn.tagsug = function(E) {
        var C = h.extend({},
        n, E);
        if (C.highlighter != n.highlighter) {
            C.highlight = true
        }
        var B = this;
        var D = [];
        B.each(function() {
            var F = new z(this, C);
            D.push(F)
        });
        B._tagsug_api = D;
        d && d();
        return B
    };
    function j(B) {
        o.html(B)
    }
    function s(B, C) {
        if (B) {
            o.html(B)
        }
        o.css(C).show()
    }
    function A() {
        o.hide()
    }
    var d = function() {
        o = h("#db-tagsug-list");
        if (!o.length) {
            o = h(k).appendTo(e)
        }
        o.delegate("li", "click",
        function(B) {
            var C = o.crtApi;
            C && C.choose(h(B.currentTarget))
        }).delegate("li", "hover",
        function(B) {
            h(B.currentTarget).parent().children(".on").removeClass("on").end().end().toggleClass("on")
        }).delegate("a", "click",
        function(B) {
            var C = o.crtApi;
            C && C.options.haltLink && B.preventDefault()
        }).click(function(B) {
            o.hide()
        }).keydown(function(B) {
            var C = o.crtApi;
            switch (B.keyCode) {
            case 32:
                A();
                C.node.focus();
                break;
            case 38:
                B.preventDefault();
                y.moveSelectedItem( - 1);
                break;
            case 40:
                B.preventDefault();
                y.moveSelectedItem(1);
                break;
            case 9:
                B.preventDefault();
                break;
            case 13:
                if (C && C.options.haltLink) {
                    C.node.focus();
                    B.preventDefault()
                }
                break;
            default:
                break
            }
        });
        d = null
    };
    h.TagSug = z
})(jQuery);