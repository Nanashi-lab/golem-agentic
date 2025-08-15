#[allow(static_mut_refs)]
#[allow(unsafe_op_in_unsafe_fn)]
mod bindings;
mod builtin;
mod conversions;
#[allow(unused)]
mod internal;
#[allow(unused)]
mod modules;
mod wrappers;
static JS_EXPORT_MODULE_NAME: &str = "@golemcloud/golem-ts-sdk";
static JS_EXPORT_MODULE: &str = include_str!("@golemcloud_golem-ts-sdk.js");
static JS_ADDITIONAL_MODULES: std::sync::LazyLock<
    Vec<(&str, Box<dyn (Fn() -> String) + Send + Sync>)>,
> = std::sync::LazyLock::new(|| {
    vec![("user-module", Box::new(|| { include_str!("user-module.js").to_string() }))]
});
struct Component;
struct Agent {
    resource_id: usize,
}
impl crate::bindings::exports::golem::agent::guest::GuestAgent for Agent {
    fn create(
        agent_type: String,
        input: crate::bindings::exports::golem::agent::guest::DataValue,
    ) -> Result<
        crate::bindings::exports::golem::agent::guest::Agent,
        crate::bindings::exports::golem::agent::guest::AgentError,
    > {
        crate::internal::async_exported_function(async move {
            let result: crate::wrappers::JsResult<
                crate::bindings::exports::golem::agent::guest::Agent,
                crate::bindings::golem::agent::common::AgentError,
            > = crate::internal::call_js_export(
                    "golem:agent",
                    &["guest", "Agent", "create"],
                    crate::wrappers::JsArgs((agent_type, input)),
                )
                .await;
            result.0
        })
    }
    fn get_id(&self) -> String {
        crate::internal::async_exported_function(async move {
            let result: String = crate::internal::call_js_resource_method(
                    "golem:agent",
                    &["guest", "Agent"],
                    self.resource_id,
                    "getId",
                    crate::wrappers::JsArgs(()),
                )
                .await;
            result
        })
    }
    fn invoke(
        &self,
        method_name: String,
        input: crate::bindings::exports::golem::agent::guest::DataValue,
    ) -> Result<
        crate::bindings::exports::golem::agent::guest::DataValue,
        crate::bindings::exports::golem::agent::guest::AgentError,
    > {
        crate::internal::async_exported_function(async move {
            let result: crate::wrappers::JsResult<
                crate::bindings::golem::agent::common::DataValue,
                crate::bindings::golem::agent::common::AgentError,
            > = crate::internal::call_js_resource_method(
                    "golem:agent",
                    &["guest", "Agent"],
                    self.resource_id,
                    "invoke",
                    crate::wrappers::JsArgs((method_name, input)),
                )
                .await;
            result.0
        })
    }
    fn get_definition(
        &self,
    ) -> crate::bindings::exports::golem::agent::guest::AgentType {
        crate::internal::async_exported_function(async move {
            let result: crate::bindings::golem::agent::common::AgentType = crate::internal::call_js_resource_method(
                    "golem:agent",
                    &["guest", "Agent"],
                    self.resource_id,
                    "getDefinition",
                    crate::wrappers::JsArgs(()),
                )
                .await;
            result
        })
    }
}
impl Drop for Agent {
    fn drop(&mut self) {
        crate::internal::enqueue_drop_js_resource(self.resource_id);
    }
}
impl<'js> rquickjs::IntoJs<'js>
for crate::bindings::exports::golem::agent::guest::AgentBorrow<'_> {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        let inner: &Agent = self.get();
        let resource_table: rquickjs::Object = ctx
            .globals()
            .get(crate::internal::RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        let resource_instance: rquickjs::Object = resource_table
            .get(inner.resource_id.to_string())
            .expect(
                &format!("Failed to get resource instance with id {}", inner.resource_id),
            );
        Ok(resource_instance.into_value())
    }
}
impl<'js> rquickjs::IntoJs<'js>
for crate::bindings::exports::golem::agent::guest::Agent {
    fn into_js(
        self,
        ctx: &rquickjs::Ctx<'js>,
    ) -> rquickjs::Result<rquickjs::Value<'js>> {
        let inner: &Agent = self.get();
        let resource_table: rquickjs::Object = ctx
            .globals()
            .get(crate::internal::RESOURCE_TABLE_NAME)
            .expect("Failed to get the resource table");
        let resource_instance: rquickjs::Object = resource_table
            .get(inner.resource_id.to_string())
            .expect(
                &format!("Failed to get resource instance with id {}", inner.resource_id),
            );
        Ok(resource_instance.into_value())
    }
}
impl<'js> rquickjs::FromJs<'js>
for crate::bindings::exports::golem::agent::guest::Agent {
    fn from_js(
        ctx: &rquickjs::Ctx<'js>,
        value: rquickjs::Value<'js>,
    ) -> rquickjs::Result<Self> {
        let resource = value
            .into_object()
            .ok_or_else(|| {
                rquickjs::Error::new_from_js_message(
                    "JS Resource instance",
                    "WASM resource instance",
                    "The value is not an object",
                )
            })?;
        let already_registered = resource
            .contains_key(crate::internal::RESOURCE_ID_KEY)?;
        let resource_id: usize = if already_registered {
            resource.get(crate::internal::RESOURCE_ID_KEY)?
        } else {
            let resource_table: rquickjs::Object = ctx
                .globals()
                .get(crate::internal::RESOURCE_TABLE_NAME)?;
            let resource_id = crate::internal::get_free_resource_id();
            resource_table.set(resource_id.to_string(), resource)?;
            resource_id
        };
        Ok(
            crate::bindings::exports::golem::agent::guest::Agent::new(Agent {
                resource_id,
            }),
        )
    }
}
impl crate::bindings::exports::golem::agent::guest::Guest for Component {
    type Agent = Agent;
    fn get_agent(
        agent_type: String,
        agent_id: String,
    ) -> crate::bindings::exports::golem::agent::guest::Agent {
        crate::internal::async_exported_function(async move {
            let result: crate::bindings::exports::golem::agent::guest::Agent = crate::internal::call_js_export(
                    "golem:agent",
                    &["guest", "getAgent"],
                    crate::wrappers::JsArgs((agent_type, agent_id)),
                )
                .await;
            result
        })
    }
    fn invoke_agent(
        agent_type: String,
        agent_id: String,
        method_name: String,
        input: crate::bindings::exports::golem::agent::guest::DataValue,
    ) -> Result<
        crate::bindings::exports::golem::agent::guest::DataValue,
        crate::bindings::exports::golem::agent::guest::AgentError,
    > {
        crate::internal::async_exported_function(async move {
            let result: crate::wrappers::JsResult<
                crate::bindings::golem::agent::common::DataValue,
                crate::bindings::golem::agent::common::AgentError,
            > = crate::internal::call_js_export(
                    "golem:agent",
                    &["guest", "invokeAgent"],
                    crate::wrappers::JsArgs((agent_type, agent_id, method_name, input)),
                )
                .await;
            result.0
        })
    }
    fn discover_agents() -> Vec<crate::bindings::exports::golem::agent::guest::Agent> {
        crate::internal::async_exported_function(async move {
            let result: Vec<crate::bindings::exports::golem::agent::guest::Agent> = crate::internal::call_js_export(
                    "golem:agent",
                    &["guest", "discoverAgents"],
                    crate::wrappers::JsArgs(()),
                )
                .await;
            result.into_iter().map(|v| v).collect::<Vec<_>>()
        })
    }
    fn discover_agent_types() -> Vec<
        crate::bindings::exports::golem::agent::guest::AgentType,
    > {
        crate::internal::async_exported_function(async move {
            let result: Vec<crate::bindings::golem::agent::common::AgentType> = crate::internal::call_js_export(
                    "golem:agent",
                    &["guest", "discoverAgentTypes"],
                    crate::wrappers::JsArgs(()),
                )
                .await;
            result.into_iter().map(|v| v).collect::<Vec<_>>()
        })
    }
}
bindings::export!(Component with_types_in bindings);
