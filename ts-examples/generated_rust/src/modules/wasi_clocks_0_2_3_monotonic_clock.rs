use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
#[rquickjs::function]
fn now() -> crate::internal::BigIntWrapper<u64> {
    let result: crate::bindings::wasi::clocks::monotonic_clock::Instant = crate::bindings::wasi::clocks::monotonic_clock::now();
    crate::internal::BigIntWrapper(result)
}
#[rquickjs::function]
fn resolution() -> crate::internal::BigIntWrapper<u64> {
    let result: crate::bindings::wasi::clocks::monotonic_clock::Duration = crate::bindings::wasi::clocks::monotonic_clock::resolution();
    crate::internal::BigIntWrapper(result)
}
#[rquickjs::function]
fn subscribe_instant(
    when: crate::internal::BigIntWrapper<u64>,
) -> crate::bindings::wasi::clocks::monotonic_clock::Pollable {
    let result: crate::bindings::wasi::clocks::monotonic_clock::Pollable = crate::bindings::wasi::clocks::monotonic_clock::subscribe_instant(
        when.0,
    );
    result
}
#[rquickjs::function]
fn subscribe_duration(
    when: crate::internal::BigIntWrapper<u64>,
) -> crate::bindings::wasi::clocks::monotonic_clock::Pollable {
    let result: crate::bindings::wasi::clocks::monotonic_clock::Pollable = crate::bindings::wasi::clocks::monotonic_clock::subscribe_duration(
        when.0,
    );
    result
}
pub struct JsMonotonicClockModule;
impl rquickjs::module::ModuleDef for JsMonotonicClockModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        decl.declare("now")?;
        decl.declare("resolution")?;
        decl.declare("subscribeInstant")?;
        decl.declare("subscribeDuration")?;
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export("now", js_now)?;
        exports.export("resolution", js_resolution)?;
        exports.export("subscribeInstant", js_subscribe_instant)?;
        exports.export("subscribeDuration", js_subscribe_duration)?;
        Ok(())
    }
}
