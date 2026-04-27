#!/bin/bash
# Run this on the Codespace to start llama-server
# It serves LFM2-VL on port 8081 with OpenAI-compatible API
# Supports parallel slots for multiple simultaneous requests

~/llama.cpp/build/bin/llama-server \
  -m ~/THE_TISM/models/lfm2-vl-1.6b-q4km.gguf \
  --mmproj ~/THE_TISM/models/mmproj-lfm2-vl-f16.gguf \
  --host 0.0.0.0 \
  --port 8081 \
  --parallel 4 \
  --ctx-size 4096 \
  --n-predict 512 \
  --log-disable \
  &

echo "llama-server starting on port 8081 with 4 parallel slots"
echo "OpenAI-compatible API at http://localhost:8081/v1"
