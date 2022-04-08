
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.6' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Card/Card.svelte generated by Svelte v3.46.6 */

    const file$b = "src/components/Card/Card.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "bg-zinc-100 dark:bg-zinc-700 w-full p-3 shadow-md rounded");
    			add_location(div, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/Card/CardHeader.svelte generated by Svelte v3.46.6 */

    const file$a = "src/components/Card/CardHeader.svelte";

    function create_fragment$b(ctx) {
    	let h1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "font-semibold text-sky-500 text-2xl mb-2");
    			add_location(h1, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);

    			if (default_slot) {
    				default_slot.m(h1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardHeader', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class CardHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardHeader",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Card/CardBody.svelte generated by Svelte v3.46.6 */

    function create_fragment$a(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CardBody', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CardBody> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class CardBody extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CardBody",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/Button.svelte generated by Svelte v3.46.6 */

    const file$9 = "src/components/Button.svelte";

    function create_fragment$9(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = "disabled:bg-red-400 active:bg-sky-700 hover:bg-sky-600 bg-sky-500 rounded font-bold py-2 px-5 text-white" + (/*fillSpace*/ ctx[4] ? " flex-grow" : ""));
    			attr_dev(button, "type", /*type*/ ctx[0]);
    			button.disabled = /*disabled*/ ctx[1];
    			attr_dev(button, "title", /*tooltip*/ ctx[3]);
    			add_location(button, file$9, 8, 0, 183);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onclick*/ ctx[2])) /*onclick*/ ctx[2].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[5],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*fillSpace*/ 16 && button_class_value !== (button_class_value = "disabled:bg-red-400 active:bg-sky-700 hover:bg-sky-600 bg-sky-500 rounded font-bold py-2 px-5 text-white" + (/*fillSpace*/ ctx[4] ? " flex-grow" : ""))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*type*/ 1) {
    				attr_dev(button, "type", /*type*/ ctx[0]);
    			}

    			if (!current || dirty & /*disabled*/ 2) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[1]);
    			}

    			if (!current || dirty & /*tooltip*/ 8) {
    				attr_dev(button, "title", /*tooltip*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { type = "button" } = $$props;
    	let { disabled = false } = $$props;

    	let { onclick = () => {
    		
    	} } = $$props;

    	let { tooltip = "" } = $$props;
    	let { fillSpace = false } = $$props;
    	const writable_props = ['type', 'disabled', 'onclick', 'tooltip', 'fillSpace'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('onclick' in $$props) $$invalidate(2, onclick = $$props.onclick);
    		if ('tooltip' in $$props) $$invalidate(3, tooltip = $$props.tooltip);
    		if ('fillSpace' in $$props) $$invalidate(4, fillSpace = $$props.fillSpace);
    		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		disabled,
    		onclick,
    		tooltip,
    		fillSpace
    	});

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(0, type = $$props.type);
    		if ('disabled' in $$props) $$invalidate(1, disabled = $$props.disabled);
    		if ('onclick' in $$props) $$invalidate(2, onclick = $$props.onclick);
    		if ('tooltip' in $$props) $$invalidate(3, tooltip = $$props.tooltip);
    		if ('fillSpace' in $$props) $$invalidate(4, fillSpace = $$props.fillSpace);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, disabled, onclick, tooltip, fillSpace, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			type: 0,
    			disabled: 1,
    			onclick: 2,
    			tooltip: 3,
    			fillSpace: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onclick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onclick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltip() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltip(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fillSpace() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fillSpace(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/QueryInput.svelte generated by Svelte v3.46.6 */

    const { console: console_1 } = globals;
    const file$8 = "src/components/QueryInput.svelte";

    // (33:8) <Button             fillSpace={true}             tooltip="Select the names, emails, and phone numbers of all customers with overdue payments."         >
    function create_default_slot_6$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Overdue Accounts");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(33:8) <Button             fillSpace={true}             tooltip=\\\"Select the names, emails, and phone numbers of all customers with overdue payments.\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (39:8) <Button fillSpace={true} tooltip="Select the balance of each customer account.">
    function create_default_slot_5$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Account Balances");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(39:8) <Button fillSpace={true} tooltip=\\\"Select the balance of each customer account.\\\">",
    		ctx
    	});

    	return block;
    }

    // (42:8) <Button             fillSpace={true}             tooltip="Select the phone number of all customers with more than one serviced location."         >
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Owners of Multiple Locations");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(42:8) <Button             fillSpace={true}             tooltip=\\\"Select the phone number of all customers with more than one serviced location.\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (48:8) <Button fillSpace={true} tooltip="Select the net finances for the last quarter.">
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Last Quarter's Finances");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(48:8) <Button fillSpace={true} tooltip=\\\"Select the net finances for the last quarter.\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:8) <Button fillSpace={true} tooltip="Select the net income (or loss) of each facility.">
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Net Income or Loss of Facilities");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(51:8) <Button fillSpace={true} tooltip=\\\"Select the net income (or loss) of each facility.\\\">",
    		ctx
    	});

    	return block;
    }

    // (54:8) <Button             fillSpace={true}             tooltip="Selects all power facilities. Mainly meant for debugging."             onclick={() => {                 query = "SELECT * FROM PowerFacility;";             }}         >
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("All Power Facilities");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(54:8) <Button             fillSpace={true}             tooltip=\\\"Selects all power facilities. Mainly meant for debugging.\\\"             onclick={() => {                 query = \\\"SELECT * FROM PowerFacility;\\\";             }}         >",
    		ctx
    	});

    	return block;
    }

    // (65:8) <Button disabled={!query} type="submit" tooltip="Evaluate the given query.">
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(65:8) <Button disabled={!query} type=\\\"submit\\\" tooltip=\\\"Evaluate the given query.\\\">",
    		ctx
    	});

    	return block;
    }

    // (67:8) {#if !query}
    function create_if_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You must provide a query.";
    			attr_dev(p, "class", "inline text-red-400");
    			add_location(p, file$8, 67, 12, 2370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(67:8) {#if !query}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let form;
    	let textarea;
    	let t0;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t2;
    	let button2;
    	let t3;
    	let button3;
    	let t4;
    	let button4;
    	let t5;
    	let button5;
    	let t6;
    	let div1;
    	let button6;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;

    	button0 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Select the names, emails, and phone numbers of all customers with overdue payments.",
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Select the balance of each customer account.",
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Select the phone number of all customers with more than one serviced location.",
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button3 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Select the net finances for the last quarter.",
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button4 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Select the net income (or loss) of each facility.",
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button5 = new Button({
    			props: {
    				fillSpace: true,
    				tooltip: "Selects all power facilities. Mainly meant for debugging.",
    				onclick: /*func*/ ctx[5],
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button6 = new Button({
    			props: {
    				disabled: !/*query*/ ctx[0],
    				type: "submit",
    				tooltip: "Evaluate the given query.",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = !/*query*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			textarea = element("textarea");
    			t0 = space();
    			div0 = element("div");
    			create_component(button0.$$.fragment);
    			t1 = space();
    			create_component(button1.$$.fragment);
    			t2 = space();
    			create_component(button2.$$.fragment);
    			t3 = space();
    			create_component(button3.$$.fragment);
    			t4 = space();
    			create_component(button4.$$.fragment);
    			t5 = space();
    			create_component(button5.$$.fragment);
    			t6 = space();
    			div1 = element("div");
    			create_component(button6.$$.fragment);
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(textarea, "class", "w-full bg-zinc-200/50 dark:placeholder:text-white/50 dark:text-slate-200/90 shadow-inner font-mono resize-y rounded-md px-2 py-0.5 placeholder:text-gray-500/80 my-1");
    			attr_dev(textarea, "name", "sql");
    			attr_dev(textarea, "placeholder", /*placeholder*/ ctx[2]);
    			add_location(textarea, file$8, 24, 4, 681);
    			attr_dev(div0, "class", "w-full flex flex-wrap gap-2");
    			add_location(div0, file$8, 31, 4, 952);
    			attr_dev(div1, "id", "submitContainer");
    			attr_dev(div1, "class", "flex flex-wrap items-center w-full my-2 gap-2");
    			add_location(div1, file$8, 63, 4, 2155);
    			add_location(form, file$8, 23, 0, 611);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, textarea);
    			set_input_value(textarea, /*query*/ ctx[0]);
    			append_dev(form, t0);
    			append_dev(form, div0);
    			mount_component(button0, div0, null);
    			append_dev(div0, t1);
    			mount_component(button1, div0, null);
    			append_dev(div0, t2);
    			mount_component(button2, div0, null);
    			append_dev(div0, t3);
    			mount_component(button3, div0, null);
    			append_dev(div0, t4);
    			mount_component(button4, div0, null);
    			append_dev(div0, t5);
    			mount_component(button5, div0, null);
    			append_dev(form, t6);
    			append_dev(form, div1);
    			mount_component(button6, div1, null);
    			append_dev(div1, t7);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[4]),
    					listen_dev(form, "submit", prevent_default(/*submit_handler*/ ctx[6]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*placeholder*/ 4) {
    				attr_dev(textarea, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty & /*query*/ 1) {
    				set_input_value(textarea, /*query*/ ctx[0]);
    			}

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    			const button3_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    			const button4_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button4_changes.$$scope = { dirty, ctx };
    			}

    			button4.$set(button4_changes);
    			const button5_changes = {};
    			if (dirty & /*query*/ 1) button5_changes.onclick = /*func*/ ctx[5];

    			if (dirty & /*$$scope*/ 256) {
    				button5_changes.$$scope = { dirty, ctx };
    			}

    			button5.$set(button5_changes);
    			const button6_changes = {};
    			if (dirty & /*query*/ 1) button6_changes.disabled = !/*query*/ ctx[0];

    			if (dirty & /*$$scope*/ 256) {
    				button6_changes.$$scope = { dirty, ctx };
    			}

    			button6.$set(button6_changes);

    			if (!/*query*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			transition_in(button5.$$.fragment, local);
    			transition_in(button6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(button5.$$.fragment, local);
    			transition_out(button6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			destroy_component(button4);
    			destroy_component(button5);
    			destroy_component(button6);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QueryInput', slots, []);
    	let { onSubmit = console.log } = $$props;
    	let { placeholder = 'SELECT * FROM information_schema.tables WHERE table_schema = "powerCompany";' } = $$props;
    	let { query = "" } = $$props;

    	const formDataToObject = formData => {
    		const data = {};

    		for (const field of formData) {
    			const [key, value] = field;
    			data[key] = value;
    		}

    		return data;
    	};

    	const getQueryURL = event => {
    		const formData = new FormData(event.target);
    		return formDataToObject(formData).sql;
    	};

    	const writable_props = ['onSubmit', 'placeholder', 'query'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<QueryInput> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		query = this.value;
    		$$invalidate(0, query);
    	}

    	const func = () => {
    		$$invalidate(0, query = "SELECT * FROM PowerFacility;");
    	};

    	const submit_handler = e => onSubmit(getQueryURL(e));

    	$$self.$$set = $$props => {
    		if ('onSubmit' in $$props) $$invalidate(1, onSubmit = $$props.onSubmit);
    		if ('placeholder' in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ('query' in $$props) $$invalidate(0, query = $$props.query);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		onSubmit,
    		placeholder,
    		query,
    		formDataToObject,
    		getQueryURL
    	});

    	$$self.$inject_state = $$props => {
    		if ('onSubmit' in $$props) $$invalidate(1, onSubmit = $$props.onSubmit);
    		if ('placeholder' in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ('query' in $$props) $$invalidate(0, query = $$props.query);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		query,
    		onSubmit,
    		placeholder,
    		getQueryURL,
    		textarea_input_handler,
    		func,
    		submit_handler
    	];
    }

    class QueryInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { onSubmit: 1, placeholder: 2, query: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QueryInput",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get onSubmit() {
    		throw new Error("<QueryInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<QueryInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<QueryInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<QueryInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<QueryInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<QueryInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/QueryResults.svelte generated by Svelte v3.46.6 */

    const { Object: Object_1 } = globals;
    const file$7 = "src/components/QueryResults.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (33:4) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No result.";
    			attr_dev(p, "class", "w-full dark:text-white/50");
    			add_location(p, file$7, 33, 8, 1370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(33:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:54) 
    function create_if_block_2(ctx) {
    	let table;
    	let thead;
    	let t;
    	let tbody;
    	let each_value_2 = Object.keys(/*queryResults*/ ctx[0][0]);
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*queryResults*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(thead, file$7, 15, 12, 613);
    			add_location(tbody, file$7, 20, 12, 829);
    			attr_dev(table, "class", "table-auto w-full font-mono text-left whitespace-nowrap");
    			add_location(table, file$7, 14, 8, 529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(thead, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, queryResults*/ 1) {
    				each_value_2 = Object.keys(/*queryResults*/ ctx[0][0]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(thead, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*Object, queryResults*/ 1) {
    				each_value = /*queryResults*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(14:54) ",
    		ctx
    	});

    	return block;
    }

    // (10:47) 
    function create_if_block_1$1(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Your query is invalid, please correct any queryErrors and try again. The queryError: ");
    			t1 = text(/*queryResults*/ ctx[0]);
    			attr_dev(p, "class", "text-red-400");
    			add_location(p, file$7, 10, 8, 316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*queryResults*/ 1) set_data_dev(t1, /*queryResults*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(10:47) ",
    		ctx
    	});

    	return block;
    }

    // (8:4) {#if queryError}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*queryError*/ ctx[1]);
    			attr_dev(p, "class", "text-red-400");
    			add_location(p, file$7, 8, 8, 219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*queryError*/ 2) set_data_dev(t, /*queryError*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:4) {#if queryError}",
    		ctx
    	});

    	return block;
    }

    // (17:16) {#each Object.keys(queryResults[0]) as attributeName}
    function create_each_block_2(ctx) {
    	let th;
    	let t_value = /*attributeName*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "class", "dark:text-slate-200/90 px-2");
    			add_location(th, file$7, 17, 20, 711);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*queryResults*/ 1 && t_value !== (t_value = /*attributeName*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(17:16) {#each Object.keys(queryResults[0]) as attributeName}",
    		ctx
    	});

    	return block;
    }

    // (24:24) {#each Object.values(record) as attributeValue}
    function create_each_block_1(ctx) {
    	let td;

    	let t_value = (/*attributeValue*/ ctx[5].toString() === ""
    	? "None"
    	: /*attributeValue*/ ctx[5]) + "";

    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "px-2");
    			add_location(td, file$7, 24, 28, 1085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*queryResults*/ 1 && t_value !== (t_value = (/*attributeValue*/ ctx[5].toString() === ""
    			? "None"
    			: /*attributeValue*/ ctx[5]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(24:24) {#each Object.values(record) as attributeValue}",
    		ctx
    	});

    	return block;
    }

    // (22:16) {#each queryResults as record}
    function create_each_block(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = Object.values(/*record*/ ctx[2]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "odd:bg-slate-300/25 dark:odd:bg-slate-200/10 dark:text-slate-200/90");
    			add_location(tr, file$7, 22, 20, 904);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, queryResults*/ 1) {
    				each_value_1 = Object.values(/*record*/ ctx[2]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:16) {#each queryResults as record}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*queryError*/ ctx[1]) return create_if_block$1;
    		if (typeof /*queryResults*/ ctx[0] === "string") return create_if_block_1$1;
    		if (/*queryResults*/ ctx[0] && /*queryResults*/ ctx[0].length > 0) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "space-y-4 overflow-auto");
    			add_location(div, file$7, 6, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QueryResults', slots, []);
    	let { queryResults } = $$props;
    	let { queryError } = $$props;
    	const writable_props = ['queryResults', 'queryError'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QueryResults> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('queryResults' in $$props) $$invalidate(0, queryResults = $$props.queryResults);
    		if ('queryError' in $$props) $$invalidate(1, queryError = $$props.queryError);
    	};

    	$$self.$capture_state = () => ({ queryResults, queryError });

    	$$self.$inject_state = $$props => {
    		if ('queryResults' in $$props) $$invalidate(0, queryResults = $$props.queryResults);
    		if ('queryError' in $$props) $$invalidate(1, queryError = $$props.queryError);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [queryResults, queryError];
    }

    class QueryResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { queryResults: 0, queryError: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QueryResults",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*queryResults*/ ctx[0] === undefined && !('queryResults' in props)) {
    			console.warn("<QueryResults> was created without expected prop 'queryResults'");
    		}

    		if (/*queryError*/ ctx[1] === undefined && !('queryError' in props)) {
    			console.warn("<QueryResults> was created without expected prop 'queryError'");
    		}
    	}

    	get queryResults() {
    		throw new Error("<QueryResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set queryResults(value) {
    		throw new Error("<QueryResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get queryError() {
    		throw new Error("<QueryResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set queryError(value) {
    		throw new Error("<QueryResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Copyright.svelte generated by Svelte v3.46.6 */

    const file$6 = "src/components/Copyright.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1_value = `${/*owner*/ ctx[0]} ${/*year*/ ctx[1]}` + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("© ");
    			t1 = text(t1_value);
    			attr_dev(p, "class", "text-center w-full text-sm text-slate-500/90 dark:text-white/50");
    			add_location(p, file$6, 6, 4, 133);
    			attr_dev(div, "id", "copy");
    			attr_dev(div, "class", "mx-auto my-4");
    			add_location(div, file$6, 5, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*owner, year*/ 3 && t1_value !== (t1_value = `${/*owner*/ ctx[0]} ${/*year*/ ctx[1]}` + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Copyright', slots, []);
    	let { owner = "Isaac Kilbourne" } = $$props;
    	let { year = "2022" } = $$props;
    	const writable_props = ['owner', 'year'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Copyright> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('owner' in $$props) $$invalidate(0, owner = $$props.owner);
    		if ('year' in $$props) $$invalidate(1, year = $$props.year);
    	};

    	$$self.$capture_state = () => ({ owner, year });

    	$$self.$inject_state = $$props => {
    		if ('owner' in $$props) $$invalidate(0, owner = $$props.owner);
    		if ('year' in $$props) $$invalidate(1, year = $$props.year);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [owner, year];
    }

    class Copyright extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { owner: 0, year: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Copyright",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get owner() {
    		throw new Error("<Copyright>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set owner(value) {
    		throw new Error("<Copyright>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get year() {
    		throw new Error("<Copyright>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set year(value) {
    		throw new Error("<Copyright>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/LoadingSpinner.svelte generated by Svelte v3.46.6 */

    const file$5 = "src/components/LoadingSpinner.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "mx-auto spinner border-2 w-12 h-12 rounded-full border-transparent border-y-sky-500 svelte-p97c9p");
    			add_location(div, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LoadingSpinner', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LoadingSpinner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class LoadingSpinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoadingSpinner",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/PrimaryText.svelte generated by Svelte v3.46.6 */

    const file$4 = "src/components/PrimaryText.svelte";

    function create_fragment$4(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "text-gray-500/80 dark:text-white/50");
    			add_location(p, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PrimaryText', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PrimaryText> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class PrimaryText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PrimaryText",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Schema/SchemaTable.svelte generated by Svelte v3.46.6 */

    const file$3 = "src/components/Schema/SchemaTable.svelte";

    function create_fragment$3(ctx) {
    	let table;
    	let tr;
    	let th;
    	let t0;
    	let t1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			th = element("th");
    			t0 = text(/*tableName*/ ctx[0]);
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(th, "class", "p-1 text-right bg-slate-300/25 dark:bg-slate-200/10 dark:text-slate-200/90 border-2 border-gray-500/40 dark:border-gray-100/30");
    			add_location(th, file$3, 6, 8, 99);
    			add_location(tr, file$3, 5, 4, 86);
    			attr_dev(table, "class", "my-3");
    			add_location(table, file$3, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr);
    			append_dev(tr, th);
    			append_dev(th, t0);
    			append_dev(tr, t1);

    			if (default_slot) {
    				default_slot.m(tr, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*tableName*/ 1) set_data_dev(t0, /*tableName*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SchemaTable', slots, ['default']);
    	let { tableName = "Table Name" } = $$props;
    	const writable_props = ['tableName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SchemaTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('tableName' in $$props) $$invalidate(0, tableName = $$props.tableName);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ tableName });

    	$$self.$inject_state = $$props => {
    		if ('tableName' in $$props) $$invalidate(0, tableName = $$props.tableName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tableName, $$scope, slots];
    }

    class SchemaTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { tableName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SchemaTable",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get tableName() {
    		throw new Error("<SchemaTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tableName(value) {
    		throw new Error("<SchemaTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Schema/PrimaryKeyAttribute.svelte generated by Svelte v3.46.6 */

    const file$2 = "src/components/Schema/PrimaryKeyAttribute.svelte";

    function create_fragment$2(ctx) {
    	let td;
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(/*attributeName*/ ctx[0]);
    			attr_dev(td, "class", "underline decoration-sky-500 decoration-2 p-1 text-left dark:text-slate-200/90 pr-2 border-2 border-gray-500/40 dark:border-gray-100/30");
    			add_location(td, file$2, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*attributeName*/ 1) set_data_dev(t, /*attributeName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PrimaryKeyAttribute', slots, []);
    	let { attributeName = "primaryKeyAttr" } = $$props;
    	const writable_props = ['attributeName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PrimaryKeyAttribute> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('attributeName' in $$props) $$invalidate(0, attributeName = $$props.attributeName);
    	};

    	$$self.$capture_state = () => ({ attributeName });

    	$$self.$inject_state = $$props => {
    		if ('attributeName' in $$props) $$invalidate(0, attributeName = $$props.attributeName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [attributeName];
    }

    class PrimaryKeyAttribute extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { attributeName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PrimaryKeyAttribute",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get attributeName() {
    		throw new Error("<PrimaryKeyAttribute>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attributeName(value) {
    		throw new Error("<PrimaryKeyAttribute>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Schema/Attribute.svelte generated by Svelte v3.46.6 */

    const file$1 = "src/components/Schema/Attribute.svelte";

    function create_fragment$1(ctx) {
    	let td;
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(/*attributeName*/ ctx[0]);
    			attr_dev(td, "class", "px-2 py-1 text-right dark:text-slate-200/90 border-2 border-gray-500/40 dark:border-gray-100/30");
    			add_location(td, file$1, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*attributeName*/ 1) set_data_dev(t, /*attributeName*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Attribute', slots, []);
    	let { attributeName = "primaryKeyAttr" } = $$props;
    	const writable_props = ['attributeName'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Attribute> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('attributeName' in $$props) $$invalidate(0, attributeName = $$props.attributeName);
    	};

    	$$self.$capture_state = () => ({ attributeName });

    	$$self.$inject_state = $$props => {
    		if ('attributeName' in $$props) $$invalidate(0, attributeName = $$props.attributeName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [attributeName];
    }

    class Attribute extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { attributeName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Attribute",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get attributeName() {
    		throw new Error("<Attribute>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attributeName(value) {
    		throw new Error("<Attribute>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const requestBaseUrl = "http://colef.club:6969/";
    const method = "get";
    const mode = "cors";
    const headers = {};

    const makeMySQLQuery = async (query) => {
        const urlEncodedQuery = encodeURI(query);
        const requestUrl = `${requestBaseUrl}?sql=${urlEncodedQuery}`;

        const res = await fetch(requestUrl, { method, mode, headers }) //
            .then((res) => res.json());

        return res;
    };

    var queries = {
        makeMySQLQuery,
    };

    /* src/App.svelte generated by Svelte v3.46.6 */
    const file = "src/App.svelte";

    // (42:8) <CardHeader>
    function create_default_slot_17(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("MySQL Query");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(42:8) <CardHeader>",
    		ctx
    	});

    	return block;
    }

    // (44:12) <PrimaryText>
    function create_default_slot_16(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("This frontend is not secured in the slightest, please be responsible.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(44:12) <PrimaryText>",
    		ctx
    	});

    	return block;
    }

    // (43:8) <CardBody>
    function create_default_slot_15(ctx) {
    	let primarytext;
    	let t;
    	let queryinput;
    	let current;

    	primarytext = new PrimaryText({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	queryinput = new QueryInput({
    			props: { onSubmit: /*doQuery*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarytext.$$.fragment);
    			t = space();
    			create_component(queryinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarytext, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(queryinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const primarytext_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				primarytext_changes.$$scope = { dirty, ctx };
    			}

    			primarytext.$set(primarytext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarytext.$$.fragment, local);
    			transition_in(queryinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarytext.$$.fragment, local);
    			transition_out(queryinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarytext, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(queryinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(43:8) <CardBody>",
    		ctx
    	});

    	return block;
    }

    // (41:4) <Card>
    function create_default_slot_14(ctx) {
    	let cardheader;
    	let t;
    	let cardbody;
    	let current;

    	cardheader = new CardHeader({
    			props: {
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	cardbody = new CardBody({
    			props: {
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardheader.$$.fragment);
    			t = space();
    			create_component(cardbody.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardheader, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(cardbody, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cardheader_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				cardheader_changes.$$scope = { dirty, ctx };
    			}

    			cardheader.$set(cardheader_changes);
    			const cardbody_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				cardbody_changes.$$scope = { dirty, ctx };
    			}

    			cardbody.$set(cardbody_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardheader.$$.fragment, local);
    			transition_in(cardbody.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardheader.$$.fragment, local);
    			transition_out(cardbody.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardheader, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(cardbody, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(41:4) <Card>",
    		ctx
    	});

    	return block;
    }

    // (51:8) <CardHeader>
    function create_default_slot_13(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Results");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(51:8) <CardHeader>",
    		ctx
    	});

    	return block;
    }

    // (60:12) {:else}
    function create_else_block(ctx) {
    	let queryresults;
    	let current;

    	queryresults = new QueryResults({
    			props: {
    				queryResults: /*queryResults*/ ctx[0],
    				queryError: /*queryError*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(queryresults.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(queryresults, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const queryresults_changes = {};
    			if (dirty & /*queryResults*/ 1) queryresults_changes.queryResults = /*queryResults*/ ctx[0];
    			if (dirty & /*queryError*/ 2) queryresults_changes.queryError = /*queryError*/ ctx[1];
    			queryresults.$set(queryresults_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(queryresults.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(queryresults.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(queryresults, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(60:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:32) 
    function create_if_block_1(ctx) {
    	let loadingspinner;
    	let current;
    	loadingspinner = new LoadingSpinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loadingspinner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loadingspinner, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingspinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loadingspinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loadingspinner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(58:32) ",
    		ctx
    	});

    	return block;
    }

    // (53:12) {#if !queryHasBeenMade}
    function create_if_block(ctx) {
    	let primarytext;
    	let current;

    	primarytext = new PrimaryText({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarytext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarytext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const primarytext_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				primarytext_changes.$$scope = { dirty, ctx };
    			}

    			primarytext.$set(primarytext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarytext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarytext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarytext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(53:12) {#if !queryHasBeenMade}",
    		ctx
    	});

    	return block;
    }

    // (54:16) <PrimaryText>
    function create_default_slot_12(ctx) {
    	let t0;
    	let b;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("Enter a MySQL query or select a preset and press\n                    ");
    			b = element("b");
    			b.textContent = "Submit";
    			t2 = text(". The result will appear here.");
    			add_location(b, file, 55, 20, 2014);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, b, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(b);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(54:16) <PrimaryText>",
    		ctx
    	});

    	return block;
    }

    // (52:8) <CardBody>
    function create_default_slot_11(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*queryHasBeenMade*/ ctx[2]) return 0;
    		if (/*isLoading*/ ctx[3]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(52:8) <CardBody>",
    		ctx
    	});

    	return block;
    }

    // (50:4) <Card>
    function create_default_slot_10(ctx) {
    	let cardheader;
    	let t;
    	let cardbody;
    	let current;

    	cardheader = new CardHeader({
    			props: {
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	cardbody = new CardBody({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardheader.$$.fragment);
    			t = space();
    			create_component(cardbody.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardheader, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(cardbody, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cardheader_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				cardheader_changes.$$scope = { dirty, ctx };
    			}

    			cardheader.$set(cardheader_changes);
    			const cardbody_changes = {};

    			if (dirty & /*$$scope, queryHasBeenMade, isLoading, queryResults, queryError*/ 47) {
    				cardbody_changes.$$scope = { dirty, ctx };
    			}

    			cardbody.$set(cardbody_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardheader.$$.fragment, local);
    			transition_in(cardbody.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardheader.$$.fragment, local);
    			transition_out(cardbody.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardheader, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(cardbody, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(50:4) <Card>",
    		ctx
    	});

    	return block;
    }

    // (66:8) <CardHeader>
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Schema");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(66:8) <CardHeader>",
    		ctx
    	});

    	return block;
    }

    // (67:8) <PrimaryText>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("These are the tables and attributes of the database. A blue underline indicates the\n            attribute is part of the primary key.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(67:8) <PrimaryText>",
    		ctx
    	});

    	return block;
    }

    // (72:12) <SchemaTable tableName="PrimaryContact">
    function create_default_slot_7(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let t2;
    	let attribute2;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "customerID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "email" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "phoneNumber" },
    			$$inline: true
    		});

    	attribute2 = new Attribute({
    			props: { attributeName: "name" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    			t2 = space();
    			create_component(attribute2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(attribute2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			transition_in(attribute2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			transition_out(attribute2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(attribute2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(72:12) <SchemaTable tableName=\\\"PrimaryContact\\\">",
    		ctx
    	});

    	return block;
    }

    // (78:12) <SchemaTable tableName="Region">
    function create_default_slot_6(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "regionID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "name" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "unitCost" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(78:12) <SchemaTable tableName=\\\"Region\\\">",
    		ctx
    	});

    	return block;
    }

    // (83:12) <SchemaTable tableName="PowerFacility">
    function create_default_slot_5(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let t2;
    	let attribute2;
    	let t3;
    	let attribute3;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "facilityID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "name" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "address" },
    			$$inline: true
    		});

    	attribute2 = new Attribute({
    			props: { attributeName: "volumeGenerated" },
    			$$inline: true
    		});

    	attribute3 = new Attribute({
    			props: { attributeName: "energyForm" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    			t2 = space();
    			create_component(attribute2.$$.fragment);
    			t3 = space();
    			create_component(attribute3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(attribute2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(attribute3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			transition_in(attribute2.$$.fragment, local);
    			transition_in(attribute3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			transition_out(attribute2.$$.fragment, local);
    			transition_out(attribute3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(attribute2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(attribute3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(83:12) <SchemaTable tableName=\\\"PowerFacility\\\">",
    		ctx
    	});

    	return block;
    }

    // (90:12) <SchemaTable tableName="SuppliesRegion">
    function create_default_slot_4(ctx) {
    	let primarykeyattribute0;
    	let t;
    	let primarykeyattribute1;
    	let current;

    	primarykeyattribute0 = new PrimaryKeyAttribute({
    			props: { attributeName: "facilityID" },
    			$$inline: true
    		});

    	primarykeyattribute1 = new PrimaryKeyAttribute({
    			props: { attributeName: "regionID" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute0.$$.fragment);
    			t = space();
    			create_component(primarykeyattribute1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(primarykeyattribute1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute0.$$.fragment, local);
    			transition_in(primarykeyattribute1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute0.$$.fragment, local);
    			transition_out(primarykeyattribute1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(primarykeyattribute1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(90:12) <SchemaTable tableName=\\\"SuppliesRegion\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:12) <SchemaTable tableName="ServicedLocation">
    function create_default_slot_3(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let t2;
    	let attribute2;
    	let t3;
    	let attribute3;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "locationID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "energyUsed" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "address" },
    			$$inline: true
    		});

    	attribute2 = new Attribute({
    			props: { attributeName: "primaryContact" },
    			$$inline: true
    		});

    	attribute3 = new Attribute({
    			props: { attributeName: "regionID" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    			t2 = space();
    			create_component(attribute2.$$.fragment);
    			t3 = space();
    			create_component(attribute3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(attribute2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(attribute3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			transition_in(attribute2.$$.fragment, local);
    			transition_in(attribute3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			transition_out(attribute2.$$.fragment, local);
    			transition_out(attribute3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(attribute2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(attribute3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(94:12) <SchemaTable tableName=\\\"ServicedLocation\\\">",
    		ctx
    	});

    	return block;
    }

    // (101:12) <SchemaTable tableName="Invoice">
    function create_default_slot_2(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let t2;
    	let attribute2;
    	let t3;
    	let attribute3;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "invoiceID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "dateIssued" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "amountOwed" },
    			$$inline: true
    		});

    	attribute2 = new Attribute({
    			props: { attributeName: "amountPaid" },
    			$$inline: true
    		});

    	attribute3 = new Attribute({
    			props: { attributeName: "billedTo" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    			t2 = space();
    			create_component(attribute2.$$.fragment);
    			t3 = space();
    			create_component(attribute3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(attribute2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(attribute3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			transition_in(attribute2.$$.fragment, local);
    			transition_in(attribute3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			transition_out(attribute2.$$.fragment, local);
    			transition_out(attribute3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(attribute2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(attribute3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(101:12) <SchemaTable tableName=\\\"Invoice\\\">",
    		ctx
    	});

    	return block;
    }

    // (108:12) <SchemaTable tableName="FacilityTransaction">
    function create_default_slot_1(ctx) {
    	let primarykeyattribute;
    	let t0;
    	let attribute0;
    	let t1;
    	let attribute1;
    	let t2;
    	let attribute2;
    	let t3;
    	let attribute3;
    	let t4;
    	let attribute4;
    	let current;

    	primarykeyattribute = new PrimaryKeyAttribute({
    			props: { attributeName: "expenseID" },
    			$$inline: true
    		});

    	attribute0 = new Attribute({
    			props: { attributeName: "cost" },
    			$$inline: true
    		});

    	attribute1 = new Attribute({
    			props: { attributeName: "isImport" },
    			$$inline: true
    		});

    	attribute2 = new Attribute({
    			props: { attributeName: "reason" },
    			$$inline: true
    		});

    	attribute3 = new Attribute({
    			props: { attributeName: "dateCreated" },
    			$$inline: true
    		});

    	attribute4 = new Attribute({
    			props: { attributeName: "facilityID" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(primarykeyattribute.$$.fragment);
    			t0 = space();
    			create_component(attribute0.$$.fragment);
    			t1 = space();
    			create_component(attribute1.$$.fragment);
    			t2 = space();
    			create_component(attribute2.$$.fragment);
    			t3 = space();
    			create_component(attribute3.$$.fragment);
    			t4 = space();
    			create_component(attribute4.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(primarykeyattribute, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(attribute0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(attribute1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(attribute2, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(attribute3, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(attribute4, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(primarykeyattribute.$$.fragment, local);
    			transition_in(attribute0.$$.fragment, local);
    			transition_in(attribute1.$$.fragment, local);
    			transition_in(attribute2.$$.fragment, local);
    			transition_in(attribute3.$$.fragment, local);
    			transition_in(attribute4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(primarykeyattribute.$$.fragment, local);
    			transition_out(attribute0.$$.fragment, local);
    			transition_out(attribute1.$$.fragment, local);
    			transition_out(attribute2.$$.fragment, local);
    			transition_out(attribute3.$$.fragment, local);
    			transition_out(attribute4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(primarykeyattribute, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(attribute0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(attribute1, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(attribute2, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(attribute3, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(attribute4, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(108:12) <SchemaTable tableName=\\\"FacilityTransaction\\\">",
    		ctx
    	});

    	return block;
    }

    // (65:4) <Card>
    function create_default_slot(ctx) {
    	let cardheader;
    	let t0;
    	let primarytext;
    	let t1;
    	let div;
    	let schematable0;
    	let t2;
    	let schematable1;
    	let t3;
    	let schematable2;
    	let t4;
    	let schematable3;
    	let t5;
    	let schematable4;
    	let t6;
    	let schematable5;
    	let t7;
    	let schematable6;
    	let current;

    	cardheader = new CardHeader({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	primarytext = new PrimaryText({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable0 = new SchemaTable({
    			props: {
    				tableName: "PrimaryContact",
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable1 = new SchemaTable({
    			props: {
    				tableName: "Region",
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable2 = new SchemaTable({
    			props: {
    				tableName: "PowerFacility",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable3 = new SchemaTable({
    			props: {
    				tableName: "SuppliesRegion",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable4 = new SchemaTable({
    			props: {
    				tableName: "ServicedLocation",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable5 = new SchemaTable({
    			props: {
    				tableName: "Invoice",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	schematable6 = new SchemaTable({
    			props: {
    				tableName: "FacilityTransaction",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cardheader.$$.fragment);
    			t0 = space();
    			create_component(primarytext.$$.fragment);
    			t1 = space();
    			div = element("div");
    			create_component(schematable0.$$.fragment);
    			t2 = space();
    			create_component(schematable1.$$.fragment);
    			t3 = space();
    			create_component(schematable2.$$.fragment);
    			t4 = space();
    			create_component(schematable3.$$.fragment);
    			t5 = space();
    			create_component(schematable4.$$.fragment);
    			t6 = space();
    			create_component(schematable5.$$.fragment);
    			t7 = space();
    			create_component(schematable6.$$.fragment);
    			attr_dev(div, "class", "overflow-auto");
    			add_location(div, file, 70, 8, 2538);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cardheader, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(primarytext, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(schematable0, div, null);
    			append_dev(div, t2);
    			mount_component(schematable1, div, null);
    			append_dev(div, t3);
    			mount_component(schematable2, div, null);
    			append_dev(div, t4);
    			mount_component(schematable3, div, null);
    			append_dev(div, t5);
    			mount_component(schematable4, div, null);
    			append_dev(div, t6);
    			mount_component(schematable5, div, null);
    			append_dev(div, t7);
    			mount_component(schematable6, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cardheader_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				cardheader_changes.$$scope = { dirty, ctx };
    			}

    			cardheader.$set(cardheader_changes);
    			const primarytext_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				primarytext_changes.$$scope = { dirty, ctx };
    			}

    			primarytext.$set(primarytext_changes);
    			const schematable0_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable0_changes.$$scope = { dirty, ctx };
    			}

    			schematable0.$set(schematable0_changes);
    			const schematable1_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable1_changes.$$scope = { dirty, ctx };
    			}

    			schematable1.$set(schematable1_changes);
    			const schematable2_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable2_changes.$$scope = { dirty, ctx };
    			}

    			schematable2.$set(schematable2_changes);
    			const schematable3_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable3_changes.$$scope = { dirty, ctx };
    			}

    			schematable3.$set(schematable3_changes);
    			const schematable4_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable4_changes.$$scope = { dirty, ctx };
    			}

    			schematable4.$set(schematable4_changes);
    			const schematable5_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable5_changes.$$scope = { dirty, ctx };
    			}

    			schematable5.$set(schematable5_changes);
    			const schematable6_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				schematable6_changes.$$scope = { dirty, ctx };
    			}

    			schematable6.$set(schematable6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cardheader.$$.fragment, local);
    			transition_in(primarytext.$$.fragment, local);
    			transition_in(schematable0.$$.fragment, local);
    			transition_in(schematable1.$$.fragment, local);
    			transition_in(schematable2.$$.fragment, local);
    			transition_in(schematable3.$$.fragment, local);
    			transition_in(schematable4.$$.fragment, local);
    			transition_in(schematable5.$$.fragment, local);
    			transition_in(schematable6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cardheader.$$.fragment, local);
    			transition_out(primarytext.$$.fragment, local);
    			transition_out(schematable0.$$.fragment, local);
    			transition_out(schematable1.$$.fragment, local);
    			transition_out(schematable2.$$.fragment, local);
    			transition_out(schematable3.$$.fragment, local);
    			transition_out(schematable4.$$.fragment, local);
    			transition_out(schematable5.$$.fragment, local);
    			transition_out(schematable6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cardheader, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(primarytext, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(schematable0);
    			destroy_component(schematable1);
    			destroy_component(schematable2);
    			destroy_component(schematable3);
    			destroy_component(schematable4);
    			destroy_component(schematable5);
    			destroy_component(schematable6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(65:4) <Card>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let h1;
    	let t1;
    	let div1;
    	let card0;
    	let t2;
    	let card1;
    	let t3;
    	let card2;
    	let t4;
    	let copyright;
    	let current;

    	card0 = new Card({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card1 = new Card({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	card2 = new Card({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	copyright = new Copyright({
    			props: {
    				owner: "Isaac Kilbourne, Cole Fuerth, Mathew Pellarin"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Totally Real Energy Supplier";
    			t1 = space();
    			div1 = element("div");
    			create_component(card0.$$.fragment);
    			t2 = space();
    			create_component(card1.$$.fragment);
    			t3 = space();
    			create_component(card2.$$.fragment);
    			t4 = space();
    			create_component(copyright.$$.fragment);
    			attr_dev(h1, "class", "text-sky-500 text-center text-5xl font-light");
    			add_location(h1, file, 36, 4, 1324);
    			attr_dev(div0, "id", "pageTitle");
    			attr_dev(div0, "class", "mx-auto m-8");
    			add_location(div0, file, 35, 0, 1279);
    			attr_dev(div1, "id", "columnGuide");
    			attr_dev(div1, "class", "flex flex-col gap-4 px-4 md:w-5/6 mx-auto");
    			add_location(div1, file, 39, 0, 1423);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(card0, div1, null);
    			append_dev(div1, t2);
    			mount_component(card1, div1, null);
    			append_dev(div1, t3);
    			mount_component(card2, div1, null);
    			insert_dev(target, t4, anchor);
    			mount_component(copyright, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card0_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				card0_changes.$$scope = { dirty, ctx };
    			}

    			card0.$set(card0_changes);
    			const card1_changes = {};

    			if (dirty & /*$$scope, queryHasBeenMade, isLoading, queryResults, queryError*/ 47) {
    				card1_changes.$$scope = { dirty, ctx };
    			}

    			card1.$set(card1_changes);
    			const card2_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				card2_changes.$$scope = { dirty, ctx };
    			}

    			card2.$set(card2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);
    			transition_in(card2.$$.fragment, local);
    			transition_in(copyright.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			transition_out(card2.$$.fragment, local);
    			transition_out(copyright.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(card0);
    			destroy_component(card1);
    			destroy_component(card2);
    			if (detaching) detach_dev(t4);
    			destroy_component(copyright, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let queryResults = [];
    	let queryError = "";
    	let queryHasBeenMade = false;
    	let isLoading = false;

    	const doQuery = async query => {
    		$$invalidate(2, queryHasBeenMade = $$invalidate(3, isLoading = true));
    		$$invalidate(0, queryResults = []);
    		$$invalidate(1, queryError = "");

    		try {
    			$$invalidate(0, queryResults = await queries.makeMySQLQuery(query));
    		} catch(err) {
    			$$invalidate(1, queryError = "Unable to make query. This isn't an issue with your query.");
    		}

    		$$invalidate(3, isLoading = false);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Card,
    		CardHeader,
    		CardBody,
    		QueryInput,
    		QueryResults,
    		Copyright,
    		LoadingSpinner,
    		PrimaryText,
    		SchemaTable,
    		PrimaryKeyAttribute,
    		Attribute,
    		makeMySQLQuery: queries.makeMySQLQuery,
    		queryResults,
    		queryError,
    		queryHasBeenMade,
    		isLoading,
    		doQuery
    	});

    	$$self.$inject_state = $$props => {
    		if ('queryResults' in $$props) $$invalidate(0, queryResults = $$props.queryResults);
    		if ('queryError' in $$props) $$invalidate(1, queryError = $$props.queryError);
    		if ('queryHasBeenMade' in $$props) $$invalidate(2, queryHasBeenMade = $$props.queryHasBeenMade);
    		if ('isLoading' in $$props) $$invalidate(3, isLoading = $$props.isLoading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [queryResults, queryError, queryHasBeenMade, isLoading, doQuery];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
