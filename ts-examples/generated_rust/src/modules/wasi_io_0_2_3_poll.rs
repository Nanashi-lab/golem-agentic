use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
#[rquickjs::function]
fn poll(
    in_: Vec<crate::modules::wasi_io_0_2_3_poll::BorrowPollableWrapper>,
) -> Vec<u32> {
    let result: Vec<u32> = crate::bindings::wasi::io::poll::poll(
        &in_.iter().map(|v| &v.0).collect::<Vec<_>>(),
    );
    result.into_iter().map(|v| v).collect::<Vec<_>>()
}
#[derive(Clone, JsLifetime, Trace)]
pub struct Pollable {
    #[qjs(skip_trace = true)]
    inner: Option<std::rc::Rc<crate::bindings::wasi::io::poll::Pollable>>,
}
mod __impl_class_pollable_ {
    pub use super::*;
    use rquickjs::{Atom, Symbol, Value};
    impl<'js> rquickjs::class::JsClass<'js> for Pollable {
        const NAME: &'static str = "Pollable";
        type Mutable = rquickjs::class::Writable;
        fn prototype(
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<Option<rquickjs::Object<'js>>> {
            use rquickjs::class::impl_::MethodImplementor;
            let proto = rquickjs::Object::new(ctx.clone())?;
            let implementor = rquickjs::class::impl_::MethodImpl::<Self>::new();
            (&implementor).implement(&proto)?;
            let dispose_symbol: Symbol = ctx
                .globals()
                .get(crate::internal::DISPOSE_SYMBOL)?;
            let dispose_fn: Value = proto.get("__dispose")?;
            proto.set(dispose_symbol, dispose_fn)?;
            Ok(Some(proto))
        }
        fn constructor(
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<Option<rquickjs::function::Constructor<'js>>> {
            use rquickjs::class::impl_::ConstructorCreator;
            let implementor = rquickjs::class::impl_::ConstructorCreate::<Self>::new();
            (&implementor).create_constructor(ctx)
        }
    }
    impl<'js> rquickjs::IntoJs<'js> for Pollable {
        fn into_js(
            self,
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<rquickjs::Value<'js>> {
            let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
            rquickjs::IntoJs::into_js(cls, ctx)
        }
    }
    impl<'js> rquickjs::FromJs<'js> for Pollable
    where
        for<'a> rquickjs::class::impl_::CloneWrapper<
            'a,
            Self,
        >: rquickjs::class::impl_::CloneTrait<Self>,
    {
        fn from_js(
            ctx: &rquickjs::Ctx<'js>,
            value: rquickjs::Value<'js>,
        ) -> rquickjs::Result<Self> {
            use rquickjs::class::impl_::CloneTrait;
            let value = rquickjs::class::Class::<Self>::from_js(ctx, value)?;
            let borrow = value.try_borrow()?;
            Ok(rquickjs::class::impl_::CloneWrapper(&*borrow).wrap_clone())
        }
    }
}
#[rquickjs::methods(rename_all = "camelCase")]
impl Pollable {
    pub fn ready(&self) -> bool {
        let result: bool = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .ready();
        result
    }
    pub fn block(&self) -> () {
        let result: () = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .block();
        result
    }
    #[qjs(rename = "__dispose")]
    pub fn __dispose(&mut self) {
        let _ = self.inner.take();
    }
}
impl<'js> rquickjs::IntoJs<'js> for crate::bindings::wasi::io::poll::Pollable {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        Pollable {
            inner: Some(std::rc::Rc::new(self)),
        }
            .into_js(ctx)
    }
}
impl<'js> rquickjs::FromJs<'js> for crate::bindings::wasi::io::poll::Pollable {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = Pollable::from_js(ctx, value)?;
        unsafe {
            Ok(
                crate::bindings::wasi::io::poll::Pollable::from_handle(
                    wrapper
                        .inner
                        .ok_or_else(|| rquickjs::Error::FromJs {
                            from: "JavaScript object",
                            to: "Pollable",
                            message: Some(
                                "Resource has already been disposed".to_string(),
                            ),
                        })?
                        .take_handle(),
                ),
            )
        }
    }
}
pub struct BorrowPollableWrapper(pub crate::bindings::wasi::io::poll::Pollable);
impl<'js> rquickjs::FromJs<'js> for BorrowPollableWrapper {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = Pollable::from_js(ctx, value)?;
        unsafe {
            Ok(
                BorrowPollableWrapper(
                    crate::bindings::wasi::io::poll::Pollable::from_handle(
                        wrapper
                            .inner
                            .ok_or_else(|| rquickjs::Error::FromJs {
                                from: "JavaScript object",
                                to: "Pollable",
                                message: Some(
                                    "Resource has already been disposed".to_string(),
                                ),
                            })?
                            .handle(),
                    ),
                ),
            )
        }
    }
}
impl Drop for BorrowPollableWrapper {
    fn drop(&mut self) {
        let _ = self.0.take_handle();
    }
}
pub struct JsPollModule;
impl rquickjs::module::ModuleDef for JsPollModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        decl.declare("poll")?;
        decl.declare("Pollable")?;
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export("poll", js_poll)?;
        exports.export("Pollable", Pollable::constructor(ctx)?)?;
        Ok(())
    }
}
