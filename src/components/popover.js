import {createPopper} from '@popperjs/core';
import {popoverItems} from '../site/config';

/**
 * 首页右下角悬浮客服气泡(Popper 定位)。
 */
function popover() {
  return {
    popoverItems,
    popperInstance: null,

    show(tooltip) {
      tooltip.classList.remove('hidden');

      this.popperInstance = createPopper(this.$el, tooltip, {
        placement: 'left',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'arrow',
            options: {
              element: tooltip.querySelector('.arrow'),
            },
          },
        ],
      });

      this.popperInstance.update();
    },

    hide(tooltip) {
      tooltip.classList.add('hidden');

      this.popperInstance.setOptions((options) => ({
        ...options,
        modifiers: [...options.modifiers, {name: 'eventListeners', enabled: false}],
      }));
    },
  };
}

export {popover};
