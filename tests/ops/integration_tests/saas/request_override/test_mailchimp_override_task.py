import pytest

from fides.api.graph.graph import DatasetGraph
from fides.api.schemas.redis_cache import Identity
from fides.api.task.graph_task import get_cached_data_for_erasures
from tests.conftest import access_runner_tester, erasure_runner_tester
from tests.ops.graph.graph_test_util import assert_rows_match

"""
Integration-level tests to validate the SaaS request override functionality by
using Mailchimp as a sample SaaS provider whose connector requests are overriden
by user-defined ("custom") override python functions.

There is an "override" Mailchimp config that is identical to the standard Mailchimp
but with a `read` endpoint and `update` endpoint that are overriden by sample
"custom" python functions. These sample functions perform identical behavior to what
is performed by the standard framework for the standard Mailchimp config.

Therefore, our tests here are identical to the standard mailchimp test task, besides 
that they reference the special "override" config and its associated dataset. 
With this, we verify that when the custom overrides are invoked by the "override"
config, they execute successfully, which in this case happens to be the same behavior
as the standard Mailchimp config. 
"""


@pytest.mark.integration_saas
@pytest.mark.integration_saas_override
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "dsr_version",
    ["use_dsr_3_0", "use_dsr_2_0"],
)
async def test_mailchimp_override_access_request_task(
    db,
    privacy_request,
    dsr_version,
    request,
    policy,
    mailchimp_override_connection_config,
    mailchimp_override_dataset_config,
    mailchimp_identity_email,
) -> None:
    """Full access request based on the Mailchimp SaaS config"""
    request.getfixturevalue(dsr_version)  # REQUIRED to test both DSR 3.0 and 2.0

    identity = Identity(**{"email": mailchimp_identity_email})
    privacy_request.cache_identity(identity)

    dataset_name = mailchimp_override_connection_config.get_saas_config().fides_key
    merged_graph = mailchimp_override_dataset_config.get_graph()
    graph = DatasetGraph(merged_graph)

    v = access_runner_tester(
        privacy_request,
        policy,
        graph,
        [mailchimp_override_connection_config],
        {"email": mailchimp_identity_email},
        db,
    )

    assert_rows_match(
        v[f"{dataset_name}:member"],
        min_size=1,
        keys=[
            "id",
            "list_id",
            "email_address",
            "unique_email_id",
            "web_id",
            "email_type",
            "status",
            "merge_fields",
            "ip_signup",
            "timestamp_signup",
            "ip_opt",
            "timestamp_opt",
            "language",
            "email_client",
            "location",
            "source",
            "tags",
        ],
    )
    assert_rows_match(
        v[f"{dataset_name}:conversations"],
        min_size=2,
        keys=["id", "campaign_id", "list_id", "from_email", "from_label", "subject"],
    )
    assert_rows_match(
        v[f"{dataset_name}:messages"],
        min_size=3,
        keys=[
            "id",
            "conversation_id",
            "from_label",
            "from_email",
            "subject",
            "message",
            "read",
            "timestamp",
        ],
    )

    # links
    assert v[f"{dataset_name}:member"][0]["email_address"] == mailchimp_identity_email


@pytest.mark.integration_saas
@pytest.mark.integration_saas_override
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "dsr_version",
    ["use_dsr_3_0", "use_dsr_2_0"],
)
async def test_mailchimp_erasure_request_task(
    db,
    dsr_version,
    request,
    privacy_request,
    erasure_policy_string_rewrite,
    mailchimp_override_connection_config,
    mailchimp_override_dataset_config,
    mailchimp_identity_email,
    reset_override_mailchimp_data,
) -> None:
    """Full erasure request based on the Mailchimp SaaS config"""
    request.getfixturevalue(dsr_version)  # REQUIRED to test both DSR 3.0 and 2.0

    privacy_request.policy_id = erasure_policy_string_rewrite.id
    privacy_request.save(db)

    identity = Identity(**{"email": mailchimp_identity_email})
    privacy_request.cache_identity(identity)

    dataset_name = mailchimp_override_connection_config.get_saas_config().fides_key
    merged_graph = mailchimp_override_dataset_config.get_graph()
    graph = DatasetGraph(merged_graph)

    access_runner_tester(
        privacy_request,
        erasure_policy_string_rewrite,
        graph,
        [mailchimp_override_connection_config],
        {"email": mailchimp_identity_email},
        db,
    )

    x = erasure_runner_tester(
        privacy_request,
        erasure_policy_string_rewrite,
        graph,
        [mailchimp_override_connection_config],
        {"email": mailchimp_identity_email},
        get_cached_data_for_erasures(privacy_request.id),
        db,
    )

    assert x == {
        f"{dataset_name}:member": 1,
        f"{dataset_name}:conversations": 0,
        f"{dataset_name}:messages": 0,
    }
