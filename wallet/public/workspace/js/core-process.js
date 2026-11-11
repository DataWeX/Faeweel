"use strict";
const CoreProcess = (() => {
    const states = ['starting', 'running', 'stopped', 'failed'];
    const kinds = ['process', 'service', 'app'];
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let api;
    let pending;
    function load() {
        if (!pending)
            pending = (async () => {
                const response = await fetch('core/process.wasm');
                if (!response.ok)
                    throw new Error('C process core could not be loaded');
                const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {});
                api = instance.exports;
                api.hx_init();
            })().catch(error => { pending = undefined; api = undefined; throw error; });
        return pending;
    }
    function ready() {
        if (!api)
            throw new Error('C process core is not initialized');
        return api;
    }
    function write(pointer, capacity, value) {
        const buffer = new Uint8Array(ready().memory.buffer, pointer, capacity);
        buffer.fill(0);
        encoder.encodeInto(String(value), buffer.subarray(0, capacity - 1));
    }
    function read(pointer, capacity) {
        const buffer = new Uint8Array(ready().memory.buffer, pointer, capacity);
        const end = buffer.indexOf(0);
        return decoder.decode(buffer.subarray(0, end < 0 ? capacity : end));
    }
    function get(pid) {
        const core = ready();
        const state = core.hx_state(pid);
        if (state < 0)
            return null;
        const kind = kinds[core.hx_kind(pid)];
        const processState = states[state];
        if (!kind || !processState)
            throw new Error('Invalid C process record');
        return {
            pid, name: read(core.hx_name(pid), 96), user: read(core.hx_user(pid), 32),
            kind, state: processState, protected: !!core.hx_protected(pid)
        };
    }
    function list() {
        if (!api)
            return [];
        const result = [];
        for (let index = 0; index < api.hx_capacity(); index++) {
            const pid = api.hx_pid_at(index);
            const record = pid ? get(pid) : null;
            if (record)
                result.push(record);
        }
        return result.sort((a, b) => a.pid - b.pid);
    }
    function spawn(name, user, { kind = 'process', state = 'running', protected: pinned = false } = {}) {
        const core = ready();
        if (!kinds.includes(kind) || !states.includes(state) || !String(name).trim())
            throw new Error('Invalid process record');
        write(core.hx_name_input(), 96, name);
        write(core.hx_user_input(), 32, user);
        const pid = core.hx_spawn(kinds.indexOf(kind), pinned ? 1 : 0);
        if (!pid)
            throw new Error('Process registry is full');
        core.hx_update(pid, states.indexOf(state));
        const record = get(pid);
        if (!record)
            throw new Error('C process record was not created');
        return record;
    }
    function validPid(pid) { return Number.isInteger(pid) && pid > 0 && pid < 2147483647; }
    function kill(pid) { return validPid(pid) && !!ready().hx_kill(pid); }
    function release(pid) { return validPid(pid) && !!ready().hx_release(pid); }
    function update(pid, state) {
        return validPid(pid) && states.includes(state) && !!ready().hx_update(pid, states.indexOf(state));
    }
    return { load, list, spawn, kill, release, update, status: () => ({ ready: !!api, implementation: 'C / WebAssembly' }) };
})();
