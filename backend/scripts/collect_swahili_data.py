"""
Aggregate Swahili speech corpora into a unified Whisper-ready dataset.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import librosa
import numpy as np
from datasets import concatenate_datasets, load_dataset

DATASET_PATH = Path(__file__).resolve().parent.parent / "data" / "swahili_asr_dataset"
DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)


def prepare_training_data() -> Dict[str, Any]:
    """
    Combine multiple Swahili datasets for fine-tuning and persist to disk.
    """

    print("Loading Mozilla Common Voice (Swahili)...")
    cv_dataset = load_dataset(
        "mozilla-foundation/common_voice_13_0",
        "sw",
        split="train+validation",
        use_auth_token=True,  # type: ignore[arg-type]
    )

    print("Loading Kenyan Swahili dataset...")
    kenyan_data = load_dataset(
        "your-org/kenyan-swahili-asr",
        split="train",
    )

    print("Loading heritage dialect samples...")
    heritage_data = load_dataset(
        "your-org/swahili-heritage-dialects",
        split="train",
    )

    combined = concatenate_datasets([cv_dataset, kenyan_data, heritage_data])

    def preprocess_audio(batch: Dict[str, Any]) -> Dict[str, Any]:
        audio_paths = batch["path"]
        transcriptions = batch["sentence"]

        processed = {"audio": [], "text": []}

        for audio_path, transcription in zip(audio_paths, transcriptions):
            try:
                waveform, _ = librosa.load(audio_path, sr=16000)
                waveform = waveform / np.max(np.abs(waveform))
                processed["audio"].append(waveform)
                processed["text"].append(transcription.lower())
            except Exception as err:  # pragma: no cover - data quality guard
                print(f"Error processing {audio_path}: {err}")
                continue

        return processed

    dataset = combined.map(
        preprocess_audio,
        batched=True,
        batch_size=32,
        remove_columns=combined.column_names,
    )

    dataset = dataset.train_test_split(test_size=0.1, seed=42)

    print(f"Total samples: {len(dataset['train']) + len(dataset['test'])}")
    print(f"Train: {len(dataset['train'])}, Test: {len(dataset['test'])}")

    dataset.save_to_disk(str(DATASET_PATH))
    (DATASET_PATH / "meta.json").write_text(
        json.dumps(
            {
                "train": len(dataset["train"]),
                "test": len(dataset["test"]),
                "source_datasets": [
                    "mozilla-foundation/common_voice_13_0:sw",
                    "your-org/kenyan-swahili-asr",
                    "your-org/swahili-heritage-dialects",
                ],
            },
            indent=2,
        )
    )

    return dataset  # type: ignore[return-value]


if __name__ == "__main__":
    prepare_training_data()

