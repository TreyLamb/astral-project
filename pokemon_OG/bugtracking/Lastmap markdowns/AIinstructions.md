DO NOT reinvent the wheel, USE the data that we have

1. I want the walking animation. the npc stays where they are until you leave and come back and reload the map, then they are in their original spot but won't re-engage you in battle.
2. WE HAVE ALL THE DATA WE NEED IN THE POKERED_OG AND YOU SHOULD KNOW THAT. FOR ALL OF THESE CHANGES REFERENCE POKERED_OG THERE IS NOTHING YOU SHOULD HAVE TO 'ACCOUNT FOR MISSING XYZ' ON.
3. SAME as above.  it is already built out.  This is in trainermeta.js

REVIEW OUR FOLDERS BEFORE YOU MESS SOMETHING UP.

eVERYTHING IN OUR CURRENT REPO IS IMPORTANT TO THIS BUILD AND 100% OF THE DATA we need is in pokered_og, the only difference is that we are translating it to a different language and in some cases that changes how we build things physically because the logic or map sizing is different

4. sprite-class. refer to #2 and #3.
5. Yes you are allowed to modify the scheme but the pokered_Og will already have a method of how they handled it in the OG game that we can use without having to reinvent the wheel