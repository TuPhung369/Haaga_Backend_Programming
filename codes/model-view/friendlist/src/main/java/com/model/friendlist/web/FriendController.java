package com.model.friendlist.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.List;

@Controller
public class FriendController {

  private List<String> friends = new ArrayList<>();

  @GetMapping("/friendList")
  public String friendList(@RequestParam(value = "friend", required = false) String friend, Model model) {
    if (friend != null && !friend.isEmpty()) {
      friends.add(friend);
    }
    model.addAttribute("friends", friends);
    return "friendList";
  }
}
