define(["react", "react-class"], function Text(React, ReactClass)
{
	/**
	 * Draws styled text on a DOM canvas.
	 */
	var text = ReactClass({
		
		render: function render()
		{
			return React.createElement(
				 // Use an element without semantic value.
				"div",
				{
					// Apply any of the provided styles to the element.
					style: this.props.style
				},
				this.props.text
			)
		},
		
		// Canvas won't be available on the first cycle anyway, so use "update".
		componentDidUpdate: function didUpdate()
		{
			var canvas = this.props.canvas;
			// Make sure the image has downloaded.
			if (canvas !== null)
			{
				var ctx = canvas.getContext("2d");
				this.setFont(ctx, this.props.style);
				this.drawText(ctx, this.props.text);
			}
		},
		
		
		createParagraphs: function createParagraphs(ctx, text)
		{
			// Each linebreak indicates a new paragraph as far as this element is 
			// concerned. This does not match its DOM behaviour.
			return text.split("\n").map(function(paragraph)
			{
				// TODO: Let the text wrap if it is allowed to do so.
				return [paragraph];
			});
		},
		
		/**
		 * Draws a block of text based on the style applied to this text.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawText: function drawText(ctx, text)
		{
			// TODO: Let the paragraphs be passed down instead of generating them.
			var paragraphs = this.createParagraphs(ctx, text);
			
			ctx.save();
			ctx.translate(this.props.style.left, this.props.style.top);
			for (var i=0; i<paragraphs.length; ++i)
			{
				var lines = paragraphs[i];
				for (var currentline=0; currentline<lines.length; ++currentline)
				{
					var line = lines[currentline];
					// Account for the new line. By default the text is drawn at the 
					// baseline, which is one line higher than one might expect; that
					// issue is also solved by moving one line down.
					ctx.translate(0, this.props.style.fontSize);
					// Determine which alignment strategy to use, given a DOM canvas 
					//doesn't provide all of them, and some have side effects.
					switch(this.props.style.textAlign)
					{
						default:        this.drawTextDefaultAligned(ctx, line);  break;
						case "left":    this.drawTextLeftAligned(ctx, line);     break;
						case "right":   this.drawTextRightAligned(ctx, line);    break;
						case "center":  this.drawTextCentered(ctx, line);        break;
						case "justify": 
						{
							// The last line of justified text is typically aligned according
							// to the default alignment. Account for that by using a different
							// renderer for the last line of the paragraph.
							if (currentline !== (lines.length -1)) {
								this.drawTextJustified(ctx, line);
							} else {
								this.drawTextDefaultAligned(ctx, line)
							}
							break;
						}
					}
				}
			}
			ctx.restore();
		},
		
		drawTextDefaultAligned: function defaultAligned(ctx, text)
		{
			// TODO: Account for text direction styles (rtl, ltr).
			this.drawTextLeftAligned(ctx, text);
		},
		
		/**
		 * Draws a single line of text that hugs the left egde.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.var style = this.props.style;
		 */
		drawTextLeftAligned: function leftAligned(ctx, text)
		{
			var textWidth = ctx.measureText(text).width;
			var availableWidth = this.props.style.width || 0;
			
			var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);
			ctx.save();
			ctx.scale(scale, 1);
			
			ctx.fillText(text, 0, 0);
			ctx.restore();
		},
		
		/**
		 * Draws a single line of text that hugs the right egde.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextRightAligned: function rightAligned(ctx, text)
		{
			var textWidth = ctx.measureText(text).width;
			var availableWidth = this.props.style.width || 0;
			
			var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);
			
			ctx.save();
			ctx.translate((availableWidth - (textWidth * scale)), 0);
			ctx.scale(scale, 1);
			
			ctx.fillText(text, 0, 0);
			ctx.restore();
		},
		
		/**
		 * Draws a single line of text that hugs neither edge.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextCentered: function centerAligned(ctx, text)
		{
			var textWidth = ctx.measureText(text).width;
			var availableWidth = this.props.style.width || 0;
			
			var scale = Math.min(availableWidth / Math.max(textWidth, 1), 1);
			
			ctx.save();
			ctx.translate((availableWidth / 2) - ((textWidth * scale) / 2), 0);
			ctx.scale(scale, 1);
			
			ctx.fillText(text, 0, 0);
			ctx.restore();
		},
		
		/**
		 * Draws a single line of text that hugs the left and right egde.
		 *
		 * @param {CanvasRenderingContext2D} ctx Context used for drawing.
		 * @param {String} text Text to draw.
		 */
		drawTextJustified: function justifyAligned(ctx, text)
		{
			// The words get additional spacing.
			var words = text.split(" ");
			var spaceWidth = ctx.measureText(" ").width;
			// Amount of leftover space that is added between each two words.
			var flexible = (this.props.style.width - ctx.measureText(text).width) 
			             / (Math.max(1, words.length-1));
			
			// Update the position of the cursor.
			var xOffset = 0;
			
			for (var i=0; i<words.length; ++i)
			{
				ctx.fillText(words[i], xOffset, 0);
				xOffset += ctx.measureText(words[i]).width + spaceWidth + flexible;
			}
		},
		
		setFont: function setFont(ctx, style)
		{
			// This function should only be called internally,
			// hence no sanity checks.
			//var style = this.props.style;
			var font;
			ctx.font = font = [
				style.fontStyle, // "normal", "italic" or "oblique".
				style.fontWeight, // "thin", "normal", "bold". Can also be a number.
				style.fontSize + "px", // Size of the text in pixels.
				style.fontFamily // Array in the order of which font should be tried.
			].join(" ");
		}
		
	});
	
	text.defaultProps = {
		// Avoid sanity checks by providing a pure function.
		repaint: function repaint(){ /* Empty function which does nothing. */ },
		canvas: null, // Canvas on which this element should draw.
		text: "", // Default to an empty string.
		width: undefined, // Text can go on indefinitly on the same line.
		style: { 
			fontFamily: [ "serif" ], // Font to use if not specified.
			fontSize: 14, // Default font height (in pixels).
			fontStyle: "normal", // Normal, straight text; could be italic or oblique.
			fontWeight: 400, // Normal text weight, lower is thinner; higher thicker.
		}
	};
	return text;
});
