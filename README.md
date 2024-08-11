# ComfyUI-Benripack

## Description

ComfyUI-Benripack is an extension for ComfyUI that provides a CharacterPipe node. This node allows for managing various elements such as images, prompts, and models in a single structure, simplifying the workflow for character-based image generation.

## Features

- Management of face and pose images
- Handling of positive and negative master prompts
- Handling of positive and negative character prompts
- Integration of model, CLIP, VAE, and IPAdapter

## Installation

1. Clone this repository into your ComfyUI extensions folder:
2. Restart ComfyUI to load the extension.

## Usage

The CharacterPipe node can be used in your ComfyUI workflow. It accepts various inputs and returns a consolidated CharacterPipe structure as well as individual components.

### Inputs

- `character_pipe`: An existing CharacterPipe structure (optional)
- `face_image`: A face image
- `pose_image`: A pose image
- `add_positive_master_prompt`: Positive master prompt to add
- `add_negative_master_prompt`: Negative master prompt to add
- `add_positive_char_prompt`: Positive character prompt to add
- `add_negative_char_prompt`: Negative character prompt to add
- `model`: A model
- `clip`: A CLIP model
- `vae`: A VAE model
- `ipadapter`: An IPAdapter model

### Outputs

- `character_pipe`: The updated CharacterPipe structure
- Individual components (images, prompts, models)

## License

MIT