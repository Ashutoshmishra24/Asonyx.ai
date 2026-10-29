#!/usr/bin/env python3
"""Download and safely extract the small Vosk English model."""

from __future__ import annotations

import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path

MODEL_NAME = "vosk-model-small-en-us-0.15"
MODEL_URL = f"https://alphacephei.com/vosk/models/{MODEL_NAME}.zip"


def main() -> int:
    base = Path(__file__).resolve().parent
    models_dir = base / "models"
    destination = models_dir / MODEL_NAME
    if destination.is_dir():
        print(f"Model already installed: {destination}")
        return 0

    models_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="asonyx-vosk-") as temporary_directory:
        archive = Path(temporary_directory) / f"{MODEL_NAME}.zip"
        print(f"Downloading {MODEL_URL}")
        urllib.request.urlretrieve(MODEL_URL, archive)
        with zipfile.ZipFile(archive) as model_zip:
            root = models_dir.resolve()
            for entry in model_zip.infolist():
                target = (models_dir / entry.filename).resolve()
                if root not in target.parents and target != root:
                    raise RuntimeError(f"Unsafe path in model archive: {entry.filename}")
            model_zip.extractall(models_dir)

    if not destination.is_dir():
        raise RuntimeError("Model archive did not contain the expected directory")
    shutil.rmtree(models_dir / "__MACOSX", ignore_errors=True)
    print(f"Installed model: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
