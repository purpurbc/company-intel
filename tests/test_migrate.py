import pytest

from db.migrate import (
    FORMER_OPTIMIZATION_MIGRATIONS,
    LEGACY_TERMINAL_MIGRATION,
    _former_optimizations_are_complete,
    _legacy_baseline_is_complete,
)


def test_empty_or_squashed_ledger_does_not_adopt_legacy_baseline():
    assert _legacy_baseline_is_complete({}) is False
    assert _legacy_baseline_is_complete({'100_platform_baseline.sql': 'checksum'}) is False


def test_complete_legacy_chain_can_adopt_squashed_baseline():
    assert _legacy_baseline_is_complete({LEGACY_TERMINAL_MIGRATION: 'checksum'}) is True


def test_partial_legacy_chain_is_rejected():
    with pytest.raises(RuntimeError, match='partially applied pre-squash'):
        _legacy_baseline_is_complete({'100_metadata.sql': 'checksum'})


def test_complete_former_optimization_chain_can_adopt_consolidated_file():
    applied = {filename: 'checksum' for filename in FORMER_OPTIMIZATION_MIGRATIONS}
    assert _former_optimizations_are_complete(applied) is True


def test_partial_former_optimization_chain_is_rejected():
    filename = next(iter(FORMER_OPTIMIZATION_MIGRATIONS))
    with pytest.raises(RuntimeError, match='partially applied pre-consolidation'):
        _former_optimizations_are_complete({filename: 'checksum'})
