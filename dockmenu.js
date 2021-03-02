/**
 * 初始化仿macos鱼眼效果菜单
 * @author doubleam
 * @date 2021.1
 * @email hxbpandaoh@163.com
 * @site http://a.biugle.cn
 * @description 心血来潮想写一个仿macos鱼眼效果菜单，代码还需优化，希望有好兄弟看到帮忙提一下PR。
 * @returns {dockMenu}
 */
var dockMenu = function dockMenu() {
  /**
   * 根据产生鱼眼菜单的位置选择设置不同的margin
   * @type object
   */
  const MARGIN_TYPE = {
    'top': 'Bottom',
    'right': 'Left',
    'bottom': 'Top',
    'left': 'Right'
  };
  /**
   * 防止定时器混乱，设置为全局变量。
   */
  var timer;

  /**
   * 初始化菜单参数
   */
  var _initDockMenu = function () {
    let _this = this;
    this.positionType = this.options.position || 'bottom';
    // 菜单是否在垂直方向
    this.isVertical = ['top', 'bottom'].includes(this.positionType);
    this.$menuContainer = document.querySelector(this.options.parent || "#menu-container");
    this.$menuElement = document.querySelector(this.options.el || ".dock-menu");
    // 菜单父容器Element
    this.$menuContainer.classList.add(`menu-${this.positionType}`);
    // 菜单Element
    this.$menuElement.classList.add('before-transition');
    // 所有菜单子元素item
    this.$items = Array.prototype.slice.call(document.querySelectorAll(this.options.item || '.menu-item'));
    // 菜单item大小初始值（默认宽高一致，不一致请自行修改css。）
    this.initialItemSize = this.$items[0].offsetWidth;
    // 菜单item icon大小初始值
    this.initialItemFontSize = parseFloat(window.getComputedStyle(this.$items[0].firstElementChild, null).getPropertyValue('font-size'));
    // 菜单元素距离主轴margin初始值
    this.initialItemMargin = this.options.defaultMargin || 0;
    //获取item元素中心点
    this.itemsCenter = this.$items.map(function ($item) {
      return _this.isVertical ? $item.offsetLeft + ($item.offsetWidth / 2) : $item.offsetTop + ($item.offsetHeight / 2);
    });
    // 计算交叉轴方向的鼠标移动监听范围
    let allowMoveArea = (this.initialItemSize * (this.options.alignLimit || 1.8)) / 2;
    let alignOffset;
    let alignMoveLimit;
    if (this.isVertical) {
      alignOffset = this.$menuContainer.offsetTop;
      alignMoveLimit = this.$menuContainer.offsetHeight;
    } else {
      alignOffset = this.$menuContainer.offsetLeft;
      alignMoveLimit = this.$menuContainer.offsetWidth;
    }
    // 交叉轴监听范围最小值与最大值
    this.mouseMoveAlignMinLimit = alignOffset - allowMoveArea;
    this.mouseMoveAlignMaxLimit = alignOffset + alignMoveLimit + allowMoveArea;
    // 增长的大小比例
    this.growRatio = this.options.grow || 1.8;
    // 主轴方向的鼠标移动监听范围
    this.justifyGrowLimit = this.initialItemSize * (this.options.justifyLimit || 1.8);
    // 应该增长的大小
    this.sizeDiff = Math.round(this.initialItemSize * (this.growRatio - 1));
  };

  /**
   * 设置动画完成后，移除将item恢复原来大小的类。
   */
  var _addAnimationEndHandler = function () {
    let _this = this;
    for ($item of this.$items) {
      $item.addEventListener("transitionend", function () {
        _this.$menuElement.classList.remove('before-transition');
      });
    }
  };

  /**
   * 根据鼠标位置计算并改变item的宽高、字体大小
   * @param {float} x
   * @param {float} y
   */
  var _changeItemSize = function (x = 0, y = 0) {
    let _this = this;
    let alignPosition;
    let justifyPosition;
    // 根据不同菜单位置，计算不同的切换位置与大小。
    if (this.isVertical) {
      alignPosition = y;
      justifyPosition = x;
    } else {
      alignPosition = x;
      justifyPosition = y;
    }
    let inMoveArea = (alignPosition > this.mouseMoveAlignMinLimit && alignPosition < this.mouseMoveAlignMaxLimit);
    !inMoveArea && this.$menuElement.classList.add('before-transition');
    this.$items.forEach(function ($item, itemIndex) {
      let centerPoint = _this.itemsCenter[itemIndex];
      // 主轴方向鼠标当前位置距离各元素中心点的距离
      let distance = Math.abs(justifyPosition - centerPoint);
      // 如果距离中心点的距离大于任意方向的限制，比例不变，即item大小不改变。
      let ratio = (distance > _this.justifyGrowLimit) ? 1 : (distance / _this.justifyGrowLimit);
      let changeRatio = 1 - (inMoveArea ? ratio : 1);
      let newItemSize = _this.initialItemSize + (changeRatio * _this.sizeDiff);
      let newItemFontSize = _this.initialItemFontSize + (changeRatio * _this.sizeDiff);
      // 设置交叉轴方向的margin负值等于增长大小的一半，实现元素在中心位置。
      let newItemMargin = -(changeRatio * (_this.sizeDiff / 2));
      $item.style['width'] = `${newItemSize}px`;
      $item.style['height'] = `${newItemSize}px`;
      $item.firstElementChild.style['fontSize'] = `${newItemFontSize}px`;
      $item.style[`margin${MARGIN_TYPE[_this.positionType]}`] = `${newItemMargin}px`;
    });
  };

  /**
   * 设置父容器鼠标移动事件箭头，触发item大小的改变效果。
   * 当鼠标移出父容器后，元素恢复原来大小。（也可去除此效果，监听整个body，但此方法比较耗费系统效能）
   */
  var _addMouseEvents = function () {
    let _this = this;
    this.$menuContainer.addEventListener('mousemove', function (e) {
      _changeItemSize.call(_this, e.clientX, e.clientY);
    });
    this.$menuContainer.addEventListener('mouseleave', function (e) {
      _this.$menuElement.classList.add('before-transition');
      for ($item of _this.$items) {
        $item.style['width'] = `${_this.initialItemSize}px`;
        $item.style['height'] = `${_this.initialItemSize}px`;
        $item.firstElementChild.style['fontSize'] = `${_this.initialItemFontSize}px`;
        $item.style[`margin${MARGIN_TYPE[_this.positionType]}`] = `${_this.initialItemMargin}px`;
      }
      // 防止与animationend事件冲突，设置定时器，时间为对应item恢复大小的类css transition属性值
      clearTimeout(timer);
      timer = setTimeout(function () {
        _this.$menuElement.classList.add('before-transition');
      }, (_this.options.transition || 100) + 100);
    });
  };

  /**
   * dockMenu
   * @param {Object} options 初始化参数
   * @param {Selector} [options.parent = '#menu-container'] 父容器
   * @param {Selector} [options.el = '.dock-menu'] 待添加效果菜单，需与父容器同宽高，且item在此容器中。
   * @param {Selector} [options.item = '.menu-item'] item类名
   * @param {Number} [options.grow = 1.8] 增长的比例
   * @param {Number} [options.transition = 100] item恢复默认大小的动画时间，默认为100。
   * @param {Number} [options.defaultMargin = 0] item距离交叉轴方向距离默认值
   * @param {Number} [options.alignLimit = 1.8] item交叉轴鼠标监测距离（比例值）
   * @param {Number} [options.justifyLimit = 1.8] item主轴鼠标监测距离（比例值）
   * @param {String} [options.position = 'bottom'] 菜单显示位置，默认底部。
   */
  function dockMenu(options = {}) {
    var _proto = dockMenu.prototype;
    this.options = options;

    /**
     * 初始化dockMenu
     */
    _proto.init = function () {
      _initDockMenu.call(this);
      _addAnimationEndHandler.call(this);
      _addMouseEvents.call(this);
      return this;
    };

    /**
     * 显示dockMenu
     */
    _proto.show = function () {
      this.$menuContainer.style.opacity = 1;
      return this;
    };

    //new dockMenu()时默认init一次
    _proto.init.call(this);
    //当页面resize时重新计算元素位置
    window.onresize = () => {
      _proto.init.call(this);
    };
  }
  return dockMenu;
}();

/**
 * EXAMPLE（设置好html与css 引入fontawesome或img后）
 */
/*----------带参数----------*/
//$dockMenu = new dockMenu({
//  position: 'bottom',
//  parent: '#menu-container',
//  el: '.dock-menu',
//  item: '.menu-item',
//  grow: 1.8,
//  transition: 100,
//  defaultMargin: 0,
//  alignLimit: 1.8,
//  justifyLimit: 1.8
//});
//$dockMenu.show();
/*----------带参数----------*/
/*----------使用默认值----------*/
//$dockMenu = new dockMenu();
//$dockMenu.show();
/*----------使用默认值----------*/
/**
 * EXAMPLE（设置好html与css 引入fontawesome或img后）
 */