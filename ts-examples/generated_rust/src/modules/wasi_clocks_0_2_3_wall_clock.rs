use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
#[rquickjs::function]
fn now() -> crate::bindings::wasi::clocks::wall_clock::Datetime {
    let result: crate::bindings::wasi::clocks::wall_clock::Datetime = crate::bindings::wasi::clocks::wall_clock::now();
    result
}
#[rquickjs::function]
fn resolution() -> crate::bindings::wasi::clocks::wall_clock::Datetime {
    let result: crate::bindings::wasi::clocks::wall_clock::Datetime = crate::bindings::wasi::clocks::wall_clock::resolution();
    result
}
pub struct JsWallClockModule;
impl rquickjs::module::ModuleDef for JsWallClockModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        decl.declare("now")?;
        decl.declare("resolution")?;
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export("now", js_now)?;
        exports.export("resolution", js_resolution)?;
        Ok(())
    }
}
