"""Integration tests for the API module."""
import pytest

from fides.core import api as _api, parse
from fides.core.models import MODEL_LIST


# Helper Functions
def get_existing_id(server_url: str, object_type: str) -> int:
    """Get an ID that is known to exist."""
    return _api.show(server_url, object_type).json()["data"][-1]["id"]


def get_id_from_key(server_url: str, object_type: str, object_key: str) -> int:
    return _api.find(server_url, object_type, object_key).json()["data"]["id"]


# Tests
def test_api_ping(server_url):
    assert _api.ping(server_url).status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_show(server_url, endpoint):
    result = _api.show(url=server_url, object_type=endpoint)
    print(result.text)
    assert result.status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_create(server_url, objects_dict, endpoint):
    manifest = objects_dict[endpoint]
    result = _api.create(
        url=server_url,
        object_type=endpoint,
        json_object=manifest.json(exclude_none=True),
    )
    print(result.text)
    assert result.status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_get(server_url, endpoint):
    existing_id = get_existing_id(server_url, endpoint)
    result = _api.get(url=server_url, object_type=endpoint, object_id=existing_id)
    print(result.text)
    assert result.status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_find(server_url, objects_dict, endpoint):
    manifest = objects_dict[endpoint]
    object_key = manifest.fidesKey
    result = _api.find(url=server_url, object_type=endpoint, object_key=object_key)
    print(result.text)
    assert result.status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_sent_is_received(server_url, objects_dict, endpoint):
    """
    Confirm that the object and values that we send are the
    same as the object that the server returns.
    """
    manifest = objects_dict[endpoint]
    object_key = manifest.fidesKey

    result = _api.find(url=server_url, object_type=endpoint, object_key=object_key)
    print(result.text)
    assert result.status_code == 200
    parsed_result = parse.parse_manifest(endpoint, result.json()["data"])

    # This is a hack because the system returns objects with IDs
    manifest.id = parsed_result.id

    assert parsed_result == manifest


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_update(server_url, objects_dict, endpoint):

    manifest = objects_dict[endpoint]

    update_id = get_existing_id(server_url, endpoint)
    result = _api.update(
        url=server_url,
        object_type=endpoint,
        json_object=manifest.json(exclude_none=True),
        object_id=update_id,
    )
    print(result.text)
    assert result.status_code == 200


@pytest.mark.parametrize("endpoint", MODEL_LIST)
def test_api_delete(server_url, objects_dict, endpoint):
    manifest = objects_dict[endpoint]
    delete_id = get_id_from_key(server_url, endpoint, manifest.fidesKey)

    assert delete_id != 1
    result = _api.delete(url=server_url, object_type=endpoint, object_id=delete_id)
    print(result.text)
    assert result.status_code == 200
