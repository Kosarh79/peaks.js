/**
 * @file
 *
 * Defines the {@link Player} class.
 *
 * @module peaks/player/player
 */
define(['peaks/waveform/waveform.utils'], function(Utils) {
  'use strict';

  /**
   * A wrapper for interfacing with the HTML5 media element API.
   *
   * @class
   * @alias Player
   *
   * @param {Peaks} peaks The parent Peaks object.
   */
  function Player(peaks) {
    this._peaks = peaks;
  }

  /**
   * Initializes the player for a given media element.
   *
   * @param {HTMLMediaElement} mediaElement
   */
  Player.prototype.init = function(mediaElement) {
    var self = this;

    self._listeners = [];
    self._mediaElement = mediaElement;
    self._duration = self.getDuration();

    if (self._mediaElement.readyState === 4) {
      self._peaks.emit('player_load', self);
    }

    self._addMediaListener('timeupdate', function() {
      self._peaks.emit('player_time_update', self.getCurrentTime());
    });

    self._addMediaListener('play', function() {
      self._peaks.emit('player_play', self.getCurrentTime());
    });

    self._addMediaListener('pause', function() {
      self._peaks.emit('player_pause', self.getCurrentTime());
    });

    self._addMediaListener('seeked', function() {
      self._peaks.emit('player_seek', self.getCurrentTime());
    });

    self._interval = null;
  };

  /**
   * Adds an event listener to the media element.
   *
   * @param {String} type
   * @param {Function} callback
   * @private
   */
  Player.prototype._addMediaListener = function(type, callback) {
    this._listeners.push({ type: type, callback: callback });
    this._mediaElement.addEventListener(type, callback);
  };

  Player.prototype.destroy = function() {
    for (var i = 0; i < this._listeners.length; i++) {
      var listener = this._listeners[i];

      this._mediaElement.removeEventListener(
        listener.type,
        listener.callback
      );
    }

    this.listeners = [];

    if (self._interval !== null) {
      clearTimeout(self._interval);
      self._interval = null;
    }
  };

  Player.prototype.setSource = function(source) {
    this._mediaElement.setAttribute('src', source);
  };

  Player.prototype.getSource = function() {
    return this._mediaElement.src;
  };

  /**
   * Starts playback.
   */
  Player.prototype.play = function() {
    this._mediaElement.play();
  };

  /**
   * Pauses playback.
   */
  Player.prototype.pause = function() {
    this._mediaElement.pause();
  };

  /**
   * Returns the current playback time position, in seconds.
   *
   * @returns {Number}
   */
  Player.prototype.getCurrentTime = function() {
    return this._mediaElement.currentTime;
  };

  /**
   * Returns the media duration, in seconds.
   *
   * @returns {Number}
   */
  Player.prototype.getDuration = function() {
    return this._mediaElement.duration;
  };

  /**
   * Seeks to a given time position within the media.
   *
   * @param {Number} time The time position, in seconds.
   */
  Player.prototype.seek = function(time) {
    this._mediaElement.currentTime = time;
  };

  /**
   * Plays the given segment.
   *
   * @param {Segment} segment The segment denoting the time region to play.
   */
  Player.prototype.playSegment = function(segment) {
    var self = this;

    if (!segment ||
        segment.startTime === null || segment.startTime === undefined ||
        segment.endTime === null || segment.endTime === undefined) {
      self._peaks.logger('player.playSegment(): parameter must be a segment object');
      return;
    }

    clearTimeout(self._interval);
    self._interval = null;

    // Set audio time to segment start time
    self.seek(segment.startTime);

    // Start playing audio
    self._mediaElement.play();

    // Need to use an interval here as `timeupdate` event doesn't fire often enough
    self._interval = setInterval(function() {
      if (self.getCurrentTime() >= segment.endTime || self._mediaElement.paused) {
        clearTimeout(self._interval);
        self._interval = null;
        self._mediaElement.pause();
      }
    }, 30);
  };

  return Player;
});
