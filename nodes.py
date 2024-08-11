import torch
import numpy as np
import comfy.model_management as model_management

class CharacterPipe:
    def __init__(self, face_image=None, pose_image=None, positive_master_prompt=None, negative_master_prompt=None, positive_char_prompt=None, negative_char_prompt=None, model=None, clip=None, vae=None, ipadapter=None):
        self.face_image = face_image
        self.pose_image = pose_image
        self.positive_master_prompt = positive_master_prompt
        self.negative_master_prompt = negative_master_prompt
        self.positive_char_prompt = positive_char_prompt
        self.negative_char_prompt = negative_char_prompt
        self.model = model
        self.clip = clip
        self.vae = vae
        self.ipadapter = ipadapter

class CharacterPipeNode:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
            },
            "optional": {
                "character_pipe": ("CHARACTER_PIPE",),
                "face_image": ("IMAGE",),
                "pose_image": ("IMAGE",),
                "add_positive_master_prompt": ("CONDITIONING",),
                "add_negative_master_prompt": ("CONDITIONING",),
                "add_positive_char_prompt": ("CONDITIONING",),
                "add_negative_char_prompt": ("CONDITIONING",),
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "vae": ("VAE",),
                "ipadapter": ("IPADAPTER",),
            },
        }
    @classmethod
    def IS_CHANGED(s, reset, character_pipe, face_image, pose_image, add_positive_master_prompt, add_negative_master_prompt, add_positive_char_prompt, add_negative_char_prompt, model, clip, vae, ipadapter):
        # This method tells ComfyUI to always consider the node as changed for certain inputs
        return float("NaN")

    RETURN_TYPES = ("CHARACTER_PIPE", "IMAGE", "IMAGE", "CONDITIONING", "CONDITIONING", "CONDITIONING", "CONDITIONING", "MODEL", "CLIP", "VAE", "IPADAPTER")
    RETURN_NAMES = ("character_pipe", "face_image", "pose_image", "positive_master_prompt", "negative_master_prompt", "positive_char_prompt", "negative_char_prompt", "model", "clip", "vae", "ipadapter")

    FUNCTION = "extract_character_pipe"



    def extract_character_pipe(self, character_pipe=None, face_image=None, pose_image=None, add_positive_master_prompt=None, add_negative_master_prompt=None, add_positive_char_prompt=None, add_negative_char_prompt=None, model=None, clip=None, vae=None, ipadapter=None):
        if character_pipe is None:
            character_pipe = CharacterPipe()
        # Setting model, clip, vae, and ipadapter if provided
        if model is not None:
            character_pipe.model = model
        if clip is not None:
            character_pipe.clip = clip
        if vae is not None:
            character_pipe.vae = vae
        if ipadapter is not None:
            character_pipe.ipadapter = ipadapter

        # Handle prompts
        if character_pipe.clip is not None:
            empty_prompt = self.emptyPrompt(character_pipe.clip)
            if character_pipe.positive_master_prompt is None:
                character_pipe.positive_master_prompt = empty_prompt
            if character_pipe.positive_char_prompt is None:
                character_pipe.positive_char_prompt = empty_prompt
            if character_pipe.negative_master_prompt is None:
                character_pipe.negative_master_prompt = empty_prompt
            if character_pipe.negative_char_prompt is None:
                character_pipe.negative_char_prompt = empty_prompt

            if add_positive_master_prompt is not None:
                character_pipe.positive_master_prompt = self.concat(character_pipe.positive_master_prompt, add_positive_master_prompt)
            
            if add_positive_char_prompt is not None:
                character_pipe.positive_char_prompt = self.concat(character_pipe.positive_char_prompt, add_positive_char_prompt)

            if add_negative_master_prompt is not None:
                character_pipe.negative_master_prompt = self.concat(character_pipe.negative_master_prompt, add_negative_master_prompt)

            if add_negative_char_prompt is not None:
                character_pipe.negative_char_prompt = self.concat(character_pipe.negative_char_prompt, add_negative_char_prompt)

        if face_image is not None:
            character_pipe.face_image = face_image
        if pose_image is not None:
            character_pipe.pose_image = pose_image

        return (character_pipe, 
            character_pipe.face_image, 
            character_pipe.pose_image, 
            character_pipe.positive_master_prompt, 
            character_pipe.negative_master_prompt,
            character_pipe.positive_char_prompt, 
            character_pipe.negative_char_prompt,
            character_pipe.model, 
            character_pipe.clip, 
            character_pipe.vae, 
            character_pipe.ipadapter)


    def emptyPrompt(self, clip):
        tokens = clip.tokenize("image,")
        output = clip.encode_from_tokens(tokens, return_pooled=True, return_dict=True)
        cond = output.pop("cond")
        return [[cond, output]]  # Note the double brackets
    
    def join_prompts(self, conditioning_1, conditioning_2):
        return conditioning_1 + conditioning_2
    
    def concat(self, conditioning_to, conditioning_from):
        out = []
        cond_from = conditioning_from[0][0]

        for i in range(len(conditioning_to)):
            t1 = conditioning_to[i][0]
            tw = torch.cat((t1, cond_from),1)
            n = [tw, conditioning_to[i][1].copy()]
            out.append(n)
        
        return out

NODE_CLASS_MAPPINGS = {
    "CharacterPipe": CharacterPipeNode
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CharacterPipe": "Character Pipe"
}