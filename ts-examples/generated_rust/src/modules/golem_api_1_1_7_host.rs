use rquickjs::JsLifetime;
use rquickjs::class::{JsClass, Trace};
use std::ops::Deref;
#[rquickjs::function]
fn create_promise() -> crate::bindings::golem::api::host::PromiseId {
    let result: crate::bindings::golem::api::host::PromiseId = crate::bindings::golem::api::host::create_promise();
    result
}
#[rquickjs::function]
fn await_promise(promise_id: crate::bindings::golem::api::host::PromiseId) -> Vec<u8> {
    let result: Vec<u8> = crate::bindings::golem::api::host::await_promise(&promise_id);
    result.into_iter().map(|v| v).collect::<Vec<_>>()
}
#[rquickjs::function]
fn poll_promise(
    promise_id: crate::bindings::golem::api::host::PromiseId,
) -> Option<Vec<u8>> {
    let result: Option<Vec<u8>> = crate::bindings::golem::api::host::poll_promise(
        &promise_id,
    );
    result.map(|v| v.into_iter().map(|v| v).collect::<Vec<_>>())
}
#[rquickjs::function]
fn complete_promise(
    promise_id: crate::bindings::golem::api::host::PromiseId,
    data: Vec<u8>,
) -> bool {
    let result: bool = crate::bindings::golem::api::host::complete_promise(
        &promise_id,
        &data.into_iter().map(|v| v).collect::<Vec<_>>(),
    );
    result
}
#[rquickjs::function]
fn delete_promise(promise_id: crate::bindings::golem::api::host::PromiseId) -> () {
    let result: () = crate::bindings::golem::api::host::delete_promise(&promise_id);
    result
}
#[rquickjs::function]
fn get_oplog_index() -> crate::internal::BigIntWrapper<u64> {
    let result: crate::bindings::golem::api::host::OplogIndex = crate::bindings::golem::api::host::get_oplog_index();
    crate::internal::BigIntWrapper(result)
}
#[rquickjs::function]
fn set_oplog_index(oplog_idx: crate::internal::BigIntWrapper<u64>) -> () {
    let result: () = crate::bindings::golem::api::host::set_oplog_index(oplog_idx.0);
    result
}
#[rquickjs::function]
fn oplog_commit(replicas: u8) -> () {
    let result: () = crate::bindings::golem::api::host::oplog_commit(replicas);
    result
}
#[rquickjs::function]
fn mark_begin_operation() -> crate::internal::BigIntWrapper<u64> {
    let result: crate::bindings::golem::api::host::OplogIndex = crate::bindings::golem::api::host::mark_begin_operation();
    crate::internal::BigIntWrapper(result)
}
#[rquickjs::function]
fn mark_end_operation(begin: crate::internal::BigIntWrapper<u64>) -> () {
    let result: () = crate::bindings::golem::api::host::mark_end_operation(begin.0);
    result
}
#[rquickjs::function]
fn get_retry_policy() -> crate::bindings::golem::api::host::RetryPolicy {
    let result: crate::bindings::golem::api::host::RetryPolicy = crate::bindings::golem::api::host::get_retry_policy();
    result
}
#[rquickjs::function]
fn set_retry_policy(
    new_retry_policy: crate::bindings::golem::api::host::RetryPolicy,
) -> () {
    let result: () = crate::bindings::golem::api::host::set_retry_policy(
        new_retry_policy,
    );
    result
}
#[rquickjs::function]
fn get_oplog_persistence_level() -> crate::bindings::golem::api::host::PersistenceLevel {
    let result: crate::bindings::golem::api::host::PersistenceLevel = crate::bindings::golem::api::host::get_oplog_persistence_level();
    result
}
#[rquickjs::function]
fn set_oplog_persistence_level(
    new_persistence_level: crate::bindings::golem::api::host::PersistenceLevel,
) -> () {
    let result: () = crate::bindings::golem::api::host::set_oplog_persistence_level(
        new_persistence_level,
    );
    result
}
#[rquickjs::function]
fn get_idempotence_mode() -> bool {
    let result: bool = crate::bindings::golem::api::host::get_idempotence_mode();
    result
}
#[rquickjs::function]
fn set_idempotence_mode(idempotent: bool) -> () {
    let result: () = crate::bindings::golem::api::host::set_idempotence_mode(idempotent);
    result
}
#[rquickjs::function]
fn generate_idempotency_key() -> crate::bindings::golem::rpc::types::Uuid {
    let result: crate::bindings::golem::api::host::Uuid = crate::bindings::golem::api::host::generate_idempotency_key();
    result
}
#[rquickjs::function]
fn update_worker(
    worker_id: crate::bindings::golem::rpc::types::WorkerId,
    target_version: crate::internal::BigIntWrapper<u64>,
    mode: crate::bindings::golem::api::host::UpdateMode,
) -> () {
    let result: () = crate::bindings::golem::api::host::update_worker(
        &worker_id,
        target_version.0,
        mode,
    );
    result
}
#[rquickjs::function]
fn get_self_metadata() -> crate::bindings::golem::api::host::WorkerMetadata {
    let result: crate::bindings::golem::api::host::WorkerMetadata = crate::bindings::golem::api::host::get_self_metadata();
    result
}
#[rquickjs::function]
fn get_worker_metadata(
    worker_id: crate::bindings::golem::rpc::types::WorkerId,
) -> Option<crate::bindings::golem::api::host::WorkerMetadata> {
    let result: Option<crate::bindings::golem::api::host::WorkerMetadata> = crate::bindings::golem::api::host::get_worker_metadata(
        &worker_id,
    );
    result.map(|v| v)
}
#[rquickjs::function]
fn fork_worker(
    source_worker_id: crate::bindings::golem::rpc::types::WorkerId,
    target_worker_id: crate::bindings::golem::rpc::types::WorkerId,
    oplog_idx_cut_off: crate::internal::BigIntWrapper<u64>,
) -> () {
    let result: () = crate::bindings::golem::api::host::fork_worker(
        &source_worker_id,
        &target_worker_id,
        oplog_idx_cut_off.0,
    );
    result
}
#[rquickjs::function]
fn revert_worker(
    worker_id: crate::bindings::golem::rpc::types::WorkerId,
    revert_target: crate::bindings::golem::api::host::RevertWorkerTarget,
) -> () {
    let result: () = crate::bindings::golem::api::host::revert_worker(
        &worker_id,
        revert_target,
    );
    result
}
#[rquickjs::function]
fn resolve_component_id(
    component_reference: String,
) -> Option<crate::bindings::golem::rpc::types::ComponentId> {
    let result: Option<crate::bindings::golem::api::host::ComponentId> = crate::bindings::golem::api::host::resolve_component_id(
        component_reference.as_str(),
    );
    result.map(|v| v)
}
#[rquickjs::function]
fn resolve_worker_id(
    component_reference: String,
    worker_name: String,
) -> Option<crate::bindings::golem::rpc::types::WorkerId> {
    let result: Option<crate::bindings::golem::api::host::WorkerId> = crate::bindings::golem::api::host::resolve_worker_id(
        component_reference.as_str(),
        worker_name.as_str(),
    );
    result.map(|v| v)
}
#[rquickjs::function]
fn resolve_worker_id_strict(
    component_reference: String,
    worker_name: String,
) -> Option<crate::bindings::golem::rpc::types::WorkerId> {
    let result: Option<crate::bindings::golem::api::host::WorkerId> = crate::bindings::golem::api::host::resolve_worker_id_strict(
        component_reference.as_str(),
        worker_name.as_str(),
    );
    result.map(|v| v)
}
#[rquickjs::function]
fn fork(new_name: String) -> crate::bindings::golem::api::host::ForkResult {
    let result: crate::bindings::golem::api::host::ForkResult = crate::bindings::golem::api::host::fork(
        new_name.as_str(),
    );
    result
}
#[derive(Clone, JsLifetime, Trace)]
pub struct GetWorkers {
    #[qjs(skip_trace = true)]
    inner: Option<std::rc::Rc<crate::bindings::golem::api::host::GetWorkers>>,
}
mod __impl_class_get_workers_ {
    pub use super::*;
    use rquickjs::{Atom, Symbol, Value};
    impl<'js> rquickjs::class::JsClass<'js> for GetWorkers {
        const NAME: &'static str = "GetWorkers";
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
    impl<'js> rquickjs::IntoJs<'js> for GetWorkers {
        fn into_js(
            self,
            ctx: &rquickjs::Ctx<'js>,
        ) -> rquickjs::Result<rquickjs::Value<'js>> {
            let cls = rquickjs::class::Class::<Self>::instance(ctx.clone(), self)?;
            rquickjs::IntoJs::into_js(cls, ctx)
        }
    }
    impl<'js> rquickjs::FromJs<'js> for GetWorkers
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
impl GetWorkers {
    #[qjs(constructor)]
    pub fn new(
        component_id: crate::bindings::golem::rpc::types::ComponentId,
        filter: Option<crate::bindings::golem::api::host::WorkerAnyFilter>,
        precise: bool,
    ) -> Self {
        Self {
            inner: Some(
                std::rc::Rc::new(
                    crate::bindings::golem::api::host::GetWorkers::new(
                        component_id,
                        filter.as_ref().map(|v| v),
                        precise,
                    ),
                ),
            ),
        }
    }
    pub fn get_next(
        &self,
    ) -> Option<Vec<crate::bindings::golem::api::host::WorkerMetadata>> {
        let result: Option<Vec<crate::bindings::golem::api::host::WorkerMetadata>> = self
            .inner
            .as_ref()
            .expect("Resource has already been disposed")
            .deref()
            .get_next();
        result.map(|v| v.into_iter().map(|v| v).collect::<Vec<_>>())
    }
    #[qjs(rename = "__dispose")]
    pub fn __dispose(&mut self) {
        let _ = self.inner.take();
    }
}
impl<'js> rquickjs::IntoJs<'js> for crate::bindings::golem::api::host::GetWorkers {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        GetWorkers {
            inner: Some(std::rc::Rc::new(self)),
        }
            .into_js(ctx)
    }
}
impl<'js> rquickjs::FromJs<'js> for crate::bindings::golem::api::host::GetWorkers {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = GetWorkers::from_js(ctx, value)?;
        unsafe {
            Ok(
                crate::bindings::golem::api::host::GetWorkers::from_handle(
                    wrapper
                        .inner
                        .ok_or_else(|| rquickjs::Error::FromJs {
                            from: "JavaScript object",
                            to: "GetWorkers",
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
pub struct BorrowGetWorkersWrapper(pub crate::bindings::golem::api::host::GetWorkers);
impl<'js> rquickjs::FromJs<'js> for BorrowGetWorkersWrapper {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let wrapper = GetWorkers::from_js(ctx, value)?;
        unsafe {
            Ok(
                BorrowGetWorkersWrapper(
                    crate::bindings::golem::api::host::GetWorkers::from_handle(
                        wrapper
                            .inner
                            .ok_or_else(|| rquickjs::Error::FromJs {
                                from: "JavaScript object",
                                to: "GetWorkers",
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
impl Drop for BorrowGetWorkersWrapper {
    fn drop(&mut self) {
        let _ = self.0.take_handle();
    }
}
pub struct JsHostModule;
impl rquickjs::module::ModuleDef for JsHostModule {
    fn declare(decl: &rquickjs::module::Declarations) -> rquickjs::Result<()> {
        decl.declare("createPromise")?;
        decl.declare("awaitPromise")?;
        decl.declare("pollPromise")?;
        decl.declare("completePromise")?;
        decl.declare("deletePromise")?;
        decl.declare("getOplogIndex")?;
        decl.declare("setOplogIndex")?;
        decl.declare("oplogCommit")?;
        decl.declare("markBeginOperation")?;
        decl.declare("markEndOperation")?;
        decl.declare("getRetryPolicy")?;
        decl.declare("setRetryPolicy")?;
        decl.declare("getOplogPersistenceLevel")?;
        decl.declare("setOplogPersistenceLevel")?;
        decl.declare("getIdempotenceMode")?;
        decl.declare("setIdempotenceMode")?;
        decl.declare("generateIdempotencyKey")?;
        decl.declare("updateWorker")?;
        decl.declare("getSelfMetadata")?;
        decl.declare("getWorkerMetadata")?;
        decl.declare("forkWorker")?;
        decl.declare("revertWorker")?;
        decl.declare("resolveComponentId")?;
        decl.declare("resolveWorkerId")?;
        decl.declare("resolveWorkerIdStrict")?;
        decl.declare("fork")?;
        decl.declare("GetWorkers")?;
        Ok(())
    }
    fn evaluate<'js>(
        ctx: &rquickjs::Ctx<'js>,
        exports: &rquickjs::module::Exports<'js>,
    ) -> rquickjs::Result<()> {
        exports.export("createPromise", js_create_promise)?;
        exports.export("awaitPromise", js_await_promise)?;
        exports.export("pollPromise", js_poll_promise)?;
        exports.export("completePromise", js_complete_promise)?;
        exports.export("deletePromise", js_delete_promise)?;
        exports.export("getOplogIndex", js_get_oplog_index)?;
        exports.export("setOplogIndex", js_set_oplog_index)?;
        exports.export("oplogCommit", js_oplog_commit)?;
        exports.export("markBeginOperation", js_mark_begin_operation)?;
        exports.export("markEndOperation", js_mark_end_operation)?;
        exports.export("getRetryPolicy", js_get_retry_policy)?;
        exports.export("setRetryPolicy", js_set_retry_policy)?;
        exports.export("getOplogPersistenceLevel", js_get_oplog_persistence_level)?;
        exports.export("setOplogPersistenceLevel", js_set_oplog_persistence_level)?;
        exports.export("getIdempotenceMode", js_get_idempotence_mode)?;
        exports.export("setIdempotenceMode", js_set_idempotence_mode)?;
        exports.export("generateIdempotencyKey", js_generate_idempotency_key)?;
        exports.export("updateWorker", js_update_worker)?;
        exports.export("getSelfMetadata", js_get_self_metadata)?;
        exports.export("getWorkerMetadata", js_get_worker_metadata)?;
        exports.export("forkWorker", js_fork_worker)?;
        exports.export("revertWorker", js_revert_worker)?;
        exports.export("resolveComponentId", js_resolve_component_id)?;
        exports.export("resolveWorkerId", js_resolve_worker_id)?;
        exports.export("resolveWorkerIdStrict", js_resolve_worker_id_strict)?;
        exports.export("fork", js_fork)?;
        exports.export("GetWorkers", GetWorkers::constructor(ctx)?)?;
        Ok(())
    }
}
