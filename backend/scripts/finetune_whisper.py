"""
Fine-tune Whisper on the aggregated Swahili dataset.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict

import torch
from datasets import load_from_disk
from transformers import (
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    WhisperFeatureExtractor,
    WhisperForConditionalGeneration,
    WhisperProcessor,
    WhisperTokenizer,
)

DATASET_PATH = Path(__file__).resolve().parent.parent / "data" / "swahili_asr_dataset"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "models" / "whisper-swahili-finetuned"


def compute_metrics(pred) -> Dict[str, float]:
    from evaluate import load

    metric = load("wer")
    pred_ids = pred.predictions
    label_ids = pred.label_ids

    label_ids[label_ids == -100] = processor.tokenizer.eos_token_id  # type: ignore[name-defined]

    pred_str = processor.batch_decode(pred_ids, skip_special_tokens=True)  # type: ignore[name-defined]
    label_str = processor.batch_decode(label_ids, skip_special_tokens=True)  # type: ignore[name-defined]

    wer = metric.compute(predictions=pred_str, references=label_str)
    return {"wer": wer}


def prepare_dataset(batch):
    audio = batch["audio"]
    inputs = feature_extractor(audio, sampling_rate=16000, return_tensors="pt")  # type: ignore[name-defined]
    batch["input_features"] = inputs.input_features[0]
    batch["labels"] = tokenizer(batch["text"]).input_ids  # type: ignore[name-defined]
    return batch


if __name__ == "__main__":
    dataset = load_from_disk(str(DATASET_PATH))

    model_id = "openai/whisper-base"
    model = WhisperForConditionalGeneration.from_pretrained(model_id)

    model.encoder.requires_grad_(False)

    feature_extractor = WhisperFeatureExtractor.from_pretrained(model_id)
    tokenizer = WhisperTokenizer.from_pretrained(model_id, language="swahili", task="transcribe")
    processor = WhisperProcessor.from_pretrained(model_id, language="swahili", task="transcribe")

    dataset = dataset.map(
        prepare_dataset,
        remove_columns=dataset["train"].column_names,
    )

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(OUTPUT_DIR),
        per_device_train_batch_size=8,
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=2,
        learning_rate=1e-5,
        num_train_epochs=3,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="wer",
        greater_is_better=False,
        fp16=torch.cuda.is_available(),
        remove_unused_columns=False,
        dataloader_pin_memory=False,
        report_to=["wandb"],
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["test"],
        compute_metrics=compute_metrics,
        tokenizer=processor,
    )

    trainer.train()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(OUTPUT_DIR))
    processor.save_pretrained(str(OUTPUT_DIR))


