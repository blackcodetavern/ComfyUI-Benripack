import { app } from "/scripts/app.js"

class AnimationExtractor{
    orientation;
    model;
    container;
    frames = [];
    animation;
    constructor(data) {
        this.orientation = data.orientation;
        this.model = data.model;
        this.container = data.container;
        this.iframe = this.container.children[0];
        this.id = data.id;
        window.addEventListener('message', this.onMessage.bind(this));
    }
    onMessage(event) {
        if(event.data.type === "capture" && event.data.id === this.id) {
            this.frames = event.data.frames;
            this.animation = event.data.animation;
            this.uploadData();
        }
    }
    update(data) {
        this.orientation = data.orientation;
        this.model = data.model;
        data.id = this.id;
        this.iframe?.contentWindow?.postMessage(data, "*");
    }

    async uploadData() {
        for(let i = 0; i < this.frames.length; i++){
            const blobData = await fetch(this.frames[i]).then(r => r.blob())
            const filename = `frame_${i}.png`

            let formData = new FormData()
            formData.append('image', blobData, filename)
            formData.append('overwrite', 'true')
            formData.append('type', 'temp')
            formData.append('subFolder', 'AnimationExtractor')
            const resp = await fetch('/upload/image', {
                method: 'POST',
                body: formData,
            })
            if (resp.status === 200) {
                const data = await resp.json()
    
                console.log("[AnimationExtractor] Upload image success.", data.name)
            }
        }
        if(this.animation) {
            const blobData = await fetch(this.animation).then(r => r.blob())
            const filename = `animation_${this.id}.png`

            let formData = new FormData()
            formData.append('image', blobData, filename)
            formData.append('overwrite', 'true')
            formData.append('type', 'temp')
            formData.append('subFolder', 'AnimationExtractor')
            const resp = await fetch('/upload/image', {
                method: 'POST',
                body: formData,
            })
            if (resp.status === 200) {
                const data = await resp.json()
    
                console.log("[AnimationExtractor] Upload animation success.", data.name)
            }
        }
    }
}

function createSimpleHtmlLoader(node, inputName, app) {
    node.name = inputName;

    const container = document.createElement('div');
    container.id = `comfyui-${inputName.toLowerCase()}`;
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'none';
    const iframe = document.createElement('iframe');
    iframe.src = '/extensions/ComfyUI-Benripack/editor.html';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    container.appendChild(iframe);
    document.body.appendChild(container);

    node.onRemoved = () => {
        container.remove();
    };

    function findModelName(linkId) {
        if (!linkId) return ""
        var graph = app.graph;
        var originalNodeId = app.graph.links.find(x => x?.id == linkId).origin_id
        var modelName = app.graph.getNodeById(originalNodeId).widgets[0].value
        return modelName
    }

    var anim = new AnimationExtractor({ 
        id: node.id,
        orientation: node.widgets.find(x => x.name === "orientation").value,
        model: findModelName(node.inputs.find(x => x.name === "model").link),
        rows: node.widgets.find(x => x.name === "rows").value,
        cols: node.widgets.find(x => x.name === "cols").value,
        container: container
    })
    let widget = {
        type: "AnimationExtractor",
        name: `AnimationExtractor${inputName}`,
        AnimationExtractor:anim,
        draw: function (ctx, _, widgetWidth, y, widgetHeight) {
            const margin = 20
            const top_offset = 20
            const visible = app.canvas.ds.scale > 0.6 && this.type === "AnimationExtractor"
            const w = _.size[0] - margin * 4
            const h = _.size[1] - margin * 4
            const clientRectBound = ctx.canvas.getBoundingClientRect()
            const transform = new DOMMatrix()
                .scaleSelf(
                    clientRectBound.width / ctx.canvas.width,
                    clientRectBound.height / ctx.canvas.height
                )
                .multiplySelf(ctx.getTransform())
                .translateSelf(margin, margin + y)

            Object.assign(this.AnimationExtractor.container.style, {
                left: `${transform.a * margin + transform.e}px`,
                top: `${transform.d + transform.f + transform.d *margin}px`,
                width: `${(w * transform.a) }px`,
                height: `${((h * transform.d) + (- widgetHeight-100)*transform.d)}px`,
                position: "absolute",
                overflow: "hidden",
                zIndex: app.graph._nodes.indexOf(node),
            })

            Object.assign(this.AnimationExtractor.container.children[0].style, {
                transformOrigin: "50% 50%",
                width: '100%',
                height: '100%',
                border: '0 none',
            })

            this.AnimationExtractor.container.hidden = !visible


            this.AnimationExtractor.update({
                orientation: node.widgets.find(x => x.name === "orientation").value,
                model: findModelName(node.inputs.find(x => x.name === "model").link),
                rows: node.widgets.find(x => x.name === "rows").value,
                cols: node.widgets.find(x => x.name === "cols").value,
            })
        },
        parent: node
    }
    node.addCustomWidget(widget)
    return {
        widget: widget
    };
}

app.registerExtension({
    name: "AnimationExtractor",
    async init(app) {
        console.log("AnimationExtractor initialized");
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "AnimationExtractor") {
            nodeType.prototype.onNodeCreated = function() {
                setTimeout(() => {
                    createSimpleHtmlLoader(this, "TestNode", app);
                }, 1000);
                
            };
        }
    }
});