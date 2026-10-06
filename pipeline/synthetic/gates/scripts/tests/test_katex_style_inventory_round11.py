"""PR #370 round 11 (hpf-f4ig): derive K2 styles from installed KaTeX.

All lint regressions run without node_modules, against the checked-in JSON.
Only the regeneration check skips when the KaTeX package is not installed.
Red-first results on 746b6e1 are recorded in docs/worklog/hpf-f4ig.md.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import katex_inventory as inventory  # noqa: E402
import lint_learner_output as lint  # noqa: E402

DATA = SCRIPTS / "katex_style_commands.json"
COMMANDS = json.loads(DATA.read_text(encoding="utf-8"))["commands"]
OPEN, CLOSE = chr(0xE000), chr(0xE001)
BS = "\\"
LABELS = ("WORLD_KNOWLEDGE", "tone_misread")  # a stem and a taxonomy label
NOTATION = ("v_r", "a_n", "K_2007", "a_1", "värde_B", "antal_A", "K_diff")


@pytest.fixture(autouse=True)
def default_mode(monkeypatch):
    monkeypatch.setattr(lint.SNAKE, "strict", False)


def styled(command, body):
    return OPEN + BS + command + "{" + body + "}" + CLOSE


def label_case(command, label, placement):
    if placement == "split":
        first, last = label.split("_", 1)
        return first + "_" + styled(command, last)
    # An escaped underscore prevents the raw-text scan from satisfying the
    # assertion on its own. Exercise both a vocabulary label (tone_misread)
    # and a taxonomy stem (WORLD_KNOWLEDGE).
    return styled(command, label.replace("_", BS + "_"))


def run_json(tmp_path, values, script=SCRIPTS / "lint_learner_output.py"):
    path = tmp_path / "learner.json"
    path.write_text(json.dumps(values, ensure_ascii=False), encoding="utf-8")
    return subprocess.run([sys.executable, str(script), str(path)],
                          cwd=tmp_path, capture_output=True, text=True)


@pytest.mark.parametrize("command", COMMANDS)
@pytest.mark.parametrize("placement", ("split", "inside"))
@pytest.mark.parametrize("label", LABELS)
def test_default_scan_flags_every_style(command, placement, label):
    assert [rule for rule, _ in lint.scan_text(label_case(command, label, placement))] == ["L2-SNAKE"]


@pytest.mark.parametrize("command", COMMANDS)
def test_default_cli_flags_every_style(tmp_path, command):
    values = {f"label{i}_{placement}": label_case(command, label, placement)
              for i, label in enumerate(LABELS) for placement in ("split", "inside")}
    result = run_json(tmp_path, values)
    assert result.returncode == 1, result.stdout + result.stderr
    assert result.stderr == ""
    findings = [line for line in result.stdout.splitlines() if line.startswith("L2-SNAKE ")]
    assert len(findings) == len(values), result.stdout
    for key in values:
        assert any(f":$.{key}:" in line for line in findings), result.stdout


@pytest.mark.parametrize("command", COMMANDS)
@pytest.mark.parametrize("notation", NOTATION)
def test_default_scan_preserves_math_in_every_style(command, notation):
    assert lint.scan_text(styled(command, notation)) == []
    assert lint.scan_text(styled(command, notation.replace("_", BS + "_"))) == []


@pytest.mark.parametrize("command", COMMANDS)
def test_default_cli_preserves_math_in_every_style(tmp_path, command):
    values = [styled(command, notation) for notation in NOTATION]
    values += [styled(command, notation.replace("_", BS + "_")) for notation in NOTATION]
    result = run_json(tmp_path, values)
    assert result.returncode == 0, result.stdout + result.stderr
    assert result.stderr == ""
    assert result.stdout == "learner-output lint: clean — 1 file(s)\n"


def test_committed_inventory_matches_installed_katex(tmp_path):
    if not inventory.DEFAULT_KATEX.exists():
        pytest.skip("app/node_modules/katex is absent; regeneration requires installed KaTeX sources")
    # An installed package with missing/changed sources must fail, not skip.
    regenerated = tmp_path / DATA.name
    result = subprocess.run([
        sys.executable, str(SCRIPTS / "katex_inventory.py"),
        "--katex-root", str(inventory.DEFAULT_KATEX), "--output", str(regenerated),
    ], cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout + result.stderr
    assert regenerated.read_bytes() == DATA.read_bytes(), (
        "KaTeX font/style inventory changed: review and regenerate with "
        "python3 pipeline/synthetic/gates/scripts/katex_inventory.py")


def test_lint_needs_only_the_committed_inventory(tmp_path):
    # A standalone Python CLI copy: no node_modules, Node, or generator.
    script = tmp_path / "lint_learner_output.py"
    shutil.copyfile(SCRIPTS / script.name, script)
    shutil.copyfile(DATA, tmp_path / DATA.name)
    result = run_json(tmp_path, [label_case("mathsfit", "WORLD_KNOWLEDGE", "split")], script)
    assert result.returncode == 1, result.stdout + result.stderr
    assert result.stdout.startswith("L2-SNAKE ")


def test_inventory_reader_discovers_new_names_and_ignores_decoys():
    source = r'''
        // defineFunction({type: "font", names: ["\\commented"], props: {}});
        const aliases = {"\\notRegistered": "\\first"};
        const sizeFuncs = ["\\tiny", /* "\\commented" */ "\\newSize",];
        defineFunction({type: "sizing", names: sizeFuncs, props: {numArgs: 0}});
        defineFunction({type: "font", names: ["\\first", "\\newFont"], props: {numArgs: 1}});
        defineFunction({type: 'text', names: ['\\newText'], props: {numArgs: 1}});
    '''
    assert inventory.commands_from_source(source) == ["first", "newFont", "newSize", "newText", "tiny"]


@pytest.mark.parametrize("names", ("computed()", "[...fonts]", "[]", "missingConstant"))
def test_inventory_reader_rejects_unrecognized_registrations(names):
    # A new declaration must never be silently omitted from an upgrade.
    source = r'defineFunction({type: "font", names: ["\\known"], props: {}});'
    source += 'defineFunction({type: "font", names: ' + names + ', props: {}});'
    with pytest.raises(ValueError):
        inventory.commands_from_source(source)
