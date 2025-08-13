use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
#[rquickjs::function]
fn parse_uuid(
    uuid: String,
) -> crate::wrappers::JsResult<crate::bindings::golem::rpc::types::Uuid, String> {
    let result: Result<crate::bindings::golem::rpc::types::Uuid, String> = crate::bindings::golem::rpc::types::parse_uuid(
        uuid.as_str(),
    );
    crate::wrappers::JsResult(
        match result {
            Ok(v) => Ok(v),
            Err(v) => Err(v),
        },
    )
}
#[rquickjs::function]
fn uuid_to_string(uuid: crate::bindings::golem::rpc::types::Uuid) -> String {
    let result: String = crate::bindings::golem::rpc::types::uuid_to_string(uuid);
    result
}
#[rquickjs::function]
fn extract_value(
    vnt: crate::bindings::golem::rpc::types::ValueAndType,
) -> crate::bindings::golem::rpc::types::WitValue {
    let result: crate::bindings::golem::rpc::types::WitValue = crate::bindings::golem::rpc::types::extract_value(
        &vnt,
    );
    result
}
#[rquickjs::function]
fn extract_type(
    vnt: crate::bindings::golem::rpc::types::ValueAndType,
) -> crate::bindings::golem::rpc::types::WitType {
    let result: crate::bindings::golem::rpc::types::WitType = crate::bindings::golem::rpc::types::extract_type(
        &vnt,
    );
    result
}
#[derive(Clone, JsLifetime, Trace)]
pub struct WasmRpc {
    #[qjs(skip_trace = true)]
    inner: Option<std::rc::Rc<crate::bindings::golem::rpc::types::WasmRpc>>,
}
mod __impl_class_wasm_rpc_ {
    pub use super::*;
    use rquickjs::{Atom, Symbol, Value};
    impl<'js> rquickjs::class::JsClass<'js> for WasmRpc {
        const NAME: &'static str = "WasmRpc";
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
    impl<'js> rquickjs::IntoJs<'js> for WasmRpc {
        fn into_js(
            self,
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<rquickjs::Value<'js>> {
            let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
            rquickjs::IntoJs::into_js(cls, ctx)
        }
    }
    impl<'js> rquickjs::FromJs<'js> for WasmRpc
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
impl WasmRpc {
    #[qjs(constructor)]
    pub fn new(worker_id: crate::bindings::golem::rpc::types::WorkerId) -> Self {
        Self {
            inner: Some(
                std::rc::Rc::new(
                    crate::bindings::golem::rpc::types::WasmRpc::new(&worker_id),
                ),
            ),
        }
    }
    #[qjs(static)]
    pub fn ephemeral(
        component_id: crate::bindings::golem::rpc::types::ComponentId,
    ) -> crate::bindings::golem::rpc::types::WasmRpc {
        let result: crate::bindings::golem::rpc::types::WasmRpc = crate::bindings::golem::rpc::types::WasmRpc::ephemeral(
            component_id,
        );
        result
    }
    pub fn invoke_and_await(
        &self,
        function_name: String,
        function_params: Vec<crate::bindings::golem::rpc::types::WitValue>,
    ) -> crate::wrappers::JsResult<
        crate::bindings::golem::rpc::types::WitValue,
        crate::bindings::golem::rpc::types::RpcError,
    > {
        let result: Result<
            crate::bindings::golem::rpc::types::WitValue,
            crate::bindings::golem::rpc::types::RpcError,
        > = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .invoke_and_await(
                function_name.as_str(),
                &function_params.into_iter().map(|v| v).collect::<Vec<_>>(),
            );
        crate::wrappers::JsResult(
            match result {
                Ok(v) => Ok(v),
                Err(v) => Err(v),
            },
        )
    }
    pub fn invoke(
        &self,
        function_name: String,
        function_params: Vec<crate::bindings::golem::rpc::types::WitValue>,
    ) -> crate::wrappers::JsResult<(), crate::bindings::golem::rpc::types::RpcError> {
        let result: Result<(), crate::bindings::golem::rpc::types::RpcError> = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .invoke(
                function_name.as_str(),
                &function_params.into_iter().map(|v| v).collect::<Vec<_>>(),
            );
        crate::wrappers::JsResult(
            match result {
                Ok(v) => Ok(v),
                Err(v) => Err(v),
            },
        )
    }
    pub fn async_invoke_and_await(
        &self,
        function_name: String,
        function_params: Vec<crate::bindings::golem::rpc::types::WitValue>,
    ) -> crate::bindings::golem::rpc::types::FutureInvokeResult {
        let result: crate::bindings::golem::rpc::types::FutureInvokeResult = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .async_invoke_and_await(
                function_name.as_str(),
                &function_params.into_iter().map(|v| v).collect::<Vec<_>>(),
            );
        result
    }
    pub fn schedule_invocation(
        &self,
        scheduled_time: crate::bindings::wasi::clocks::wall_clock::Datetime,
        function_name: String,
        function_params: Vec<crate::bindings::golem::rpc::types::WitValue>,
    ) -> () {
        let result: () = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .schedule_invocation(
                scheduled_time,
                function_name.as_str(),
                &function_params.into_iter().map(|v| v).collect::<Vec<_>>(),
            );
        result
    }
    pub fn schedule_cancelable_invocation(
        &self,
        scheduled_time: crate::bindings::wasi::clocks::wall_clock::Datetime,
        function_name: String,
        function_params: Vec<crate::bindings::golem::rpc::types::WitValue>,
    ) -> crate::bindings::golem::rpc::types::CancellationToken {
        let result: crate::bindings::golem::rpc::types::CancellationToken = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .schedule_cancelable_invocation(
                scheduled_time,
                function_name.as_str(),
                &function_params.into_iter().map(|v| v).collect::<Vec<_>>(),
            );
        result
    }
    #[qjs(rename = "__dispose")]
    pub fn __dispose(&mut self) {
        let _ = self.inner.take();
    }
}
impl<'js> rquickjs::IntoJs<'js> for crate::bindings::golem::rpc::types::WasmRpc {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        WasmRpc {
            inner: Some(std::rc::Rc::new(self)),
        }
            .into_js(ctx)
    }
}
impl<'js> rquickjs::FromJs<'js> for crate::bindings::golem::rpc::types::WasmRpc {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = WasmRpc::from_js(ctx, value)?;
        unsafe {
            Ok(
                crate::bindings::golem::rpc::types::WasmRpc::from_handle(
                    wrapper
                        .inner
                        .ok_or_else(|| rquickjs::Error::FromJs {
                            from: "JavaScript object",
                            to: "WasmRpc",
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
pub struct BorrowWasmRpcWrapper(pub crate::bindings::golem::rpc::types::WasmRpc);
impl<'js> rquickjs::FromJs<'js> for BorrowWasmRpcWrapper {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = WasmRpc::from_js(ctx, value)?;
        unsafe {
            Ok(
                BorrowWasmRpcWrapper(
                    crate::bindings::golem::rpc::types::WasmRpc::from_handle(
                        wrapper
                            .inner
                            .ok_or_else(|| rquickjs::Error::FromJs {
                                from: "JavaScript object",
                                to: "WasmRpc",
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
impl Drop for BorrowWasmRpcWrapper {
    fn drop(&mut self) {
        let _ = self.0.take_handle();
    }
}
#[derive(Clone, JsLifetime, Trace)]
pub struct FutureInvokeResult {
    #[qjs(skip_trace = true)]
    inner: Option<std::rc::Rc<crate::bindings::golem::rpc::types::FutureInvokeResult>>,
}
mod __impl_class_future_invoke_result_ {
    pub use super::*;
    use rquickjs::{Atom, Symbol, Value};
    impl<'js> rquickjs::class::JsClass<'js> for FutureInvokeResult {
        const NAME: &'static str = "FutureInvokeResult";
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
    impl<'js> rquickjs::IntoJs<'js> for FutureInvokeResult {
        fn into_js(
            self,
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<rquickjs::Value<'js>> {
            let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
            rquickjs::IntoJs::into_js(cls, ctx)
        }
    }
    impl<'js> rquickjs::FromJs<'js> for FutureInvokeResult
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
impl FutureInvokeResult {
    pub fn subscribe(&self) -> crate::bindings::golem::rpc::types::Pollable {
        let result: crate::bindings::golem::rpc::types::Pollable = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .subscribe();
        result
    }
    pub fn get(
        &self,
    ) -> Option<
        crate::wrappers::JsResult<
            crate::bindings::golem::rpc::types::WitValue,
            crate::bindings::golem::rpc::types::RpcError,
        >,
    > {
        let result: Option<
            Result<
                crate::bindings::golem::rpc::types::WitValue,
                crate::bindings::golem::rpc::types::RpcError,
            >,
        > = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .get();
        result
            .map(|v| crate::wrappers::JsResult(
                match v {
                    Ok(v) => Ok(v),
                    Err(v) => Err(v),
                },
            ))
    }
    #[qjs(rename = "__dispose")]
    pub fn __dispose(&mut self) {
        let _ = self.inner.take();
    }
}
impl<'js> rquickjs::IntoJs<'js>
for crate::bindings::golem::rpc::types::FutureInvokeResult {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        FutureInvokeResult {
            inner: Some(std::rc::Rc::new(self)),
        }
            .into_js(ctx)
    }
}
impl<'js> rquickjs::FromJs<'js>
for crate::bindings::golem::rpc::types::FutureInvokeResult {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = FutureInvokeResult::from_js(ctx, value)?;
        unsafe {
            Ok(
                crate::bindings::golem::rpc::types::FutureInvokeResult::from_handle(
                    wrapper
                        .inner
                        .ok_or_else(|| rquickjs::Error::FromJs {
                            from: "JavaScript object",
                            to: "FutureInvokeResult",
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
pub struct BorrowFutureInvokeResultWrapper(
    pub crate::bindings::golem::rpc::types::FutureInvokeResult,
);
impl<'js> rquickjs::FromJs<'js> for BorrowFutureInvokeResultWrapper {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = FutureInvokeResult::from_js(ctx, value)?;
        unsafe {
            Ok(
                BorrowFutureInvokeResultWrapper(
                    crate::bindings::golem::rpc::types::FutureInvokeResult::from_handle(
                        wrapper
                            .inner
                            .ok_or_else(|| rquickjs::Error::FromJs {
                                from: "JavaScript object",
                                to: "FutureInvokeResult",
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
impl Drop for BorrowFutureInvokeResultWrapper {
    fn drop(&mut self) {
        let _ = self.0.take_handle();
    }
}
#[derive(Clone, JsLifetime, Trace)]
pub struct CancellationToken {
    #[qjs(skip_trace = true)]
    inner: Option<std::rc::Rc<crate::bindings::golem::rpc::types::CancellationToken>>,
}
mod __impl_class_cancellation_token_ {
    pub use super::*;
    use rquickjs::{Atom, Symbol, Value};
    impl<'js> rquickjs::class::JsClass<'js> for CancellationToken {
        const NAME: &'static str = "CancellationToken";
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
    impl<'js> rquickjs::IntoJs<'js> for CancellationToken {
        fn into_js(
            self,
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<rquickjs::Value<'js>> {
            let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
            rquickjs::IntoJs::into_js(cls, ctx)
        }
    }
    impl<'js> rquickjs::FromJs<'js> for CancellationToken
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
impl CancellationToken {
    pub fn cancel(&self) -> () {
        let result: () = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .cancel();
        result
    }
    #[qjs(rename = "__dispose")]
    pub fn __dispose(&mut self) {
        let _ = self.inner.take();
    }
}
impl<'js> rquickjs::IntoJs<'js>
for crate::bindings::golem::rpc::types::CancellationToken {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        CancellationToken {
            inner: Some(std::rc::Rc::new(self)),
        }
            .into_js(ctx)
    }
}
impl<'js> rquickjs::FromJs<'js>
for crate::bindings::golem::rpc::types::CancellationToken {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = CancellationToken::from_js(ctx, value)?;
        unsafe {
            Ok(
                crate::bindings::golem::rpc::types::CancellationToken::from_handle(
                    wrapper
                        .inner
                        .ok_or_else(|| rquickjs::Error::FromJs {
                            from: "JavaScript object",
                            to: "CancellationToken",
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
pub struct BorrowCancellationTokenWrapper(
    pub crate::bindings::golem::rpc::types::CancellationToken,
);
impl<'js> rquickjs::FromJs<'js> for BorrowCancellationTokenWrapper {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = CancellationToken::from_js(ctx, value)?;
        unsafe {
            Ok(
                BorrowCancellationTokenWrapper(
                    crate::bindings::golem::rpc::types::CancellationToken::from_handle(
                        wrapper
                            .inner
                            .ok_or_else(|| rquickjs::Error::FromJs {
                                from: "JavaScript object",
                                to: "CancellationToken",
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
impl Drop for BorrowCancellationTokenWrapper {
    fn drop(&mut self) {
        let _ = self.0.take_handle();
    }
}
pub struct JsTypesModule;
impl rquickjs::module::ModuleDef for JsTypesModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        decl.declare("parseUuid")?;
        decl.declare("uuidToString")?;
        decl.declare("extractValue")?;
        decl.declare("extractType")?;
        decl.declare("WasmRpc")?;
        decl.declare("FutureInvokeResult")?;
        decl.declare("CancellationToken")?;
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export("parseUuid", js_parse_uuid)?;
        exports.export("uuidToString", js_uuid_to_string)?;
        exports.export("extractValue", js_extract_value)?;
        exports.export("extractType", js_extract_type)?;
        exports.export("WasmRpc", WasmRpc::constructor(ctx)?)?;
        exports.export("FutureInvokeResult", FutureInvokeResult::constructor(ctx)?)?;
        exports.export("CancellationToken", CancellationToken::constructor(ctx)?)?;
        Ok(())
    }
}
