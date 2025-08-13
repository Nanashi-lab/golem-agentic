use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
pub struct JsCommonModule;
impl rquickjs::module::ModuleDef for JsCommonModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        Ok(())
    }
}
