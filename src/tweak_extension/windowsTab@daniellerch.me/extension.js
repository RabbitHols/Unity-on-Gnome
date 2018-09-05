
/* Based on code from windowsNavigator@gnome-shell-extensions.gcampax.github.com */

const Clutter = imports.gi.Clutter;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const St = imports.gi.St;

const Main = imports.ui.main;
const Workspace = imports.ui.workspace;
const WorkspacesView = imports.ui.workspacesView;

let current_window_id=1;

function injectToFunction(parent, name, func) {
	let origin = parent[name];
	parent[name] = function() {
		let ret;
		ret = origin.apply(this, arguments);
		if (ret === undefined)
			ret = func.apply(this, arguments);
		return ret;
	}
	return origin;
}

let winInjections, workspaceInjections, workViewInjections, createdActors, connectedSignals;

function resetState() {
	winInjections = { };
	workspaceInjections = { };
	workViewInjections = { };
	createdActors = [ ];
	connectedSignals = [ ];
}

function enable() {
	resetState();

	Workspace.WindowOverlay.prototype.setId = function(id) {
		if (this._text && this._text.visible && id == null)
			this._text.hide();
		this._id = id;
		if (id != null)
			this._text.text = this._id.toString();
	}
	winInjections['setId'] = undefined;


	Workspace.WindowOverlay.prototype.getId = function() {
		return this._id;
	}
	winInjections['getId'] = undefined;

	Workspace.WindowOverlay.prototype.showTooltip = function() {
		if (this._id == null)
			return;
		this._text.raise_top();
		this._text.show();

		if (this._id == current_window_id)
		{
			this._text.text = "Select Window";
		}
		else
		{
			this._text.hide();
		}


	}
	winInjections['showTooltip'] = undefined;


	Workspace.Workspace.prototype.showTooltip = function() {
		if (this._tip == null)
			return;
		this._tip.text = (this.metaWorkspace.index() + 1).toString();
		this._tip.x = this._x;
		this._tip.y = this._y;
		this._tip.show();
		this._tip.raise_top();
	}
	workspaceInjections['showTooltip'] = undefined;


	Workspace.Workspace.prototype.getWindowWithTooltip = function(id) {
		for (let i in this._windowOverlays) {
			if (this._windowOverlays[i] == null)
				continue;
			if (this._windowOverlays[i].getId() === id)
				return this._windowOverlays[i]._windowClone.metaWindow;
		}
		return null;
	}
	workspaceInjections['getWindowWithTooltip'] = undefined;

	Workspace.Workspace.prototype.showWindowsTooltips = function() {

		current_window_id++;
		if(current_window_id>this._windows.length)
			current_window_id=1;

		for (let i in this._windowOverlays) {

			if (this._windowOverlays[i] != null)
			{
				this._windowOverlays[i].showTooltip();
			}
		}
	}
	workspaceInjections['showWindowsTooltips'] = undefined;


	WorkspacesView.WorkspacesView.prototype._onKeyRelease = function(s, o) {

	}
	workViewInjections['_onKeyRelease'] = undefined;

	WorkspacesView.WorkspacesView.prototype._onKeyPress = function(s, o) {
		if(Main.overview._viewSelector._activeTab.id != 'windows')
			return false;

		if (o.get_key_symbol() == Clutter.KEY_Tab && !this._pickWorkspace) {
			this._prevFocusActor = global.stage.get_key_focus();
			global.stage.set_key_focus(null);
			this._active = global.screen.get_active_workspace_index();
			this._pickWindow = true;
			this._workspaces[global.screen.get_active_workspace_index()].showWindowsTooltips();
			return true;
		}


		if (global.stage.get_key_focus() != global.stage)
			return false;

		if (this._pickWindow) {
			let win = this._workspaces[this._active].getWindowWithTooltip(current_window_id);
			if (win)
				Main.activateWindow(win, global.get_current_time());

			return true;
		}


		return false;
	}
	workViewInjections['_onKeyPress'] = undefined;

	winInjections['_init'] = injectToFunction(Workspace.WindowOverlay.prototype, '_init', function(windowClone, parentActor) {
			this._id = null;
			createdActors.push(this._text = new St.Label({ style_class: 'extension-windowsTab-window-tooltip' }));
			this._text.hide();
			parentActor.add_actor(this._text);
			});

	winInjections['updatePositions'] = injectToFunction(Workspace.WindowOverlay.prototype, 'updatePositions', function(cloneX, cloneY, cloneWidth, cloneHeight) {
			let textX = cloneX-50;
			let textY = cloneY-50;
			this._text.set_position(Math.floor(textX), Math.floor(textY));
			this._text.set_size(Math.floor(cloneWidth+100), Math.floor(cloneHeight+100));
			this._text.raise_top();
			});

	workspaceInjections['_init'] = injectToFunction(Workspace.Workspace.prototype, '_init', function(metaWorkspace) {
			if (metaWorkspace && metaWorkspace.index() < 9) {
			createdActors.push(this._tip = new St.Label({ style_class: 'extension-windowsTab-window-tooltip',
					visible: false }));

			this.actor.add_actor(this._tip);
			let signalId = this.actor.connect('notify::scale-x', Lang.bind(this, function() {
					this._tip.set_scale(1 / this.actor.scale_x, 1 / this.actor.scale_x);
					}));
			connectedSignals.push({ obj: this.actor, id: signalId });
			} else
			this._tip = null;
			});

	workspaceInjections['positionWindows'] = injectToFunction(Workspace.Workspace.prototype, 'positionWindows', function(flags) {
			let visibleClones = this._windows.slice();
			if (this._reservedSlot)
			visibleClones.push(this._reservedSlot);

			let slots = this._computeAllWindowSlots(visibleClones.length);
			visibleClones = this._orderWindowsByMotionAndStartup(visibleClones, slots);
			for (let i = 0; i < visibleClones.length; i++) {
			let clone = visibleClones[i];
			let metaWindow = clone.metaWindow;
			let mainIndex = this._lookupIndex(metaWindow);
			let overlay = this._windowOverlays[mainIndex];
			if (overlay)
			overlay.setId(i+1);
			}
			});

	workViewInjections['_init'] = injectToFunction(WorkspacesView.WorkspacesView.prototype, '_init', function(width, height, x, y, workspaces) {
			this._pickWorkspace = false;
			this._pickWindow = false;
			this._keyPressEventId = global.stage.connect('key-press-event', Lang.bind(this, this._onKeyPress));
			this._keyReleaseEventId = global.stage.connect('key-release-event', Lang.bind(this, this._onKeyRelease));
			connectedSignals.push({ obj: global.stage, id: this._keyPressEventId });
			connectedSignals.push({ obj: global.stage, id: this._keyReleaseEventId });
			});

	workViewInjections['_onDestroy'] = injectToFunction(WorkspacesView.WorkspacesView.prototype, '_onDestroy', function() {
			global.stage.disconnect(this._keyPressEventId);
			global.stage.disconnect(this._keyReleaseEventId);
			connectedSignals = [ ];
			});
}

function removeInjection(object, injection, name) {
	if (injection[name] === undefined)
		delete object[name];
	else
		object[name] = injection[name];
}

function disable() {
	for (i in workspaceInjections)
		removeInjection(Workspace.Workspace.prototype, workspaceInjections, i);
	for (i in winInjections)
		removeInjection(Workspace.WindowOverlay.prototype, winInjections, i);
	for (i in workViewInjections)
		removeInjection(WorkspacesView.WorkspacesView.prototype, workViewInjections, i);

	for each (i in connectedSignals)
		i.obj.disconnect(i.id);

	for each (i in createdActors)
		i.destroy();

	resetState();
}

function init() {
	/* do nothing */
}


